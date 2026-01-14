const User = require("../models/user.model");
const Role = require("../models/role.model");
const Mascota = require("../models/mascota.model");
const UsuarioMascota = require("../models/usuario_mascota.model");
const contrasenaService = require("./contrasena.service");

class PacienteService {
  async registrarClienteConMascotas(payload) {
    const { dueno, mascotas, contrasena } = payload;

    // Para rollback manual si algo falla
    let clienteCreado = null;
    let mascotasDocs = [];

    try {
      // 1) Buscar rol CLIENTE
      const rolCliente = await Role.findOne({ nombre: "CLIENTE" }).lean();
      if (!rolCliente) {
        const error = new Error("No existe el rol CLIENTE en la base de datos");
        error.code = "ROL_CLIENTE_NO_EXISTE";
        throw error;
      }

      // 2) Crear usuario
      clienteCreado = await User.create({
        nombre_completo: dueno.nombre_completo,
        correo: dueno.correo,
        numero_celular: dueno.numero_celular,
        id_rol: rolCliente._id,
      });

      // 3) Guardar contraseña
      await contrasenaService.guardarContrasena(clienteCreado._id, contrasena, "CREACION");

      // 4) Crear mascotas
      mascotasDocs = await Mascota.insertMany(
        mascotas.map((m) => ({
          nombre: m.nombre,
          tipo_mascota: m.tipo_mascota,
          edad: m.edad,
          peso: m.peso,
          sexo: m.sexo,
          raza: m.raza,
          eliminado: false,
        }))
      );

      // 5) Crear relaciones
      await UsuarioMascota.insertMany(
        mascotasDocs.map((mascota) => ({
          id_usuario: clienteCreado._id,
          id_mascota: mascota._id,
          activo: true,
        }))
      );

      // 6) Respuesta
      return {
        cliente: {
          id: clienteCreado._id,
          nombre_completo: clienteCreado.nombre_completo,
          correo: clienteCreado.correo,
          numero_celular: clienteCreado.numero_celular,
          rol: "CLIENTE",
        },
        mascotas: mascotasDocs.map((m) => ({
          id: m._id,
          nombre: m.nombre,
          edad: m.edad,
          peso: m.peso,
          sexo: m.sexo,
          raza: m.raza,
          tipo_mascota: m.tipo_mascota,
        })),
      };
    } catch (error) {
      // 🔥 rollback manual (best-effort)
      try {
        if (mascotasDocs.length > 0) {
          const idsMascotas = mascotasDocs.map((m) => m._id);
          await UsuarioMascota.deleteMany({ id_mascota: { $in: idsMascotas } });
          await Mascota.deleteMany({ _id: { $in: idsMascotas } });
        }

        if (clienteCreado) {
          // borrar contraseñas del usuario y usuario
          const Contrasena = require("../models/contrasena.model");
          await Contrasena.deleteMany({ id_usuario: clienteCreado._id });
          await User.deleteOne({ _id: clienteCreado._id });
        }
      } catch (rollbackError) {
        console.error("Rollback falló:", rollbackError);
      }

      throw error;
    }
  }

  async registrarMascotasParaClienteExistente(payload) {
  const { id_usuario, mascotas } = payload;

  // 1) Validar usuario existe y está activo (no eliminado)
  const usuario = await User.findOne({ _id: id_usuario, eliminado: false })
    .populate("id_rol", "nombre")
    .lean();

  if (!usuario) {
    const error = new Error("Usuario no encontrado o eliminado");
    error.code = "USUARIO_NO_ENCONTRADO";
    throw error;
  }

  // 2) Validar que sea CLIENTE (opcional pero recomendado)
  if (usuario.id_rol?.nombre !== "CLIENTE") {
    const error = new Error("El usuario no tiene rol CLIENTE");
    error.code = "USUARIO_NO_ES_CLIENTE";
    throw error;
  }

  if (!Array.isArray(mascotas) || mascotas.length === 0) {
    const error = new Error("Debe enviarse un arreglo 'mascotas' con al menos 1 elemento");
    error.code = "MASCOTAS_INVALIDAS";
    throw error;
  }

  // 3) Crear mascotas (todas arrancan como no eliminadas)
  const mascotasDocs = await Mascota.insertMany(
    mascotas.map((m) => ({
      nombre: m.nombre,
      tipo_mascota: m.tipo_mascota,
      edad: m.edad,
      peso: m.peso,
      sexo: m.sexo,
      raza: m.raza,
      eliminado: false,
    }))
  );

  // 4) Crear relaciones usuario_mascota (activas)
  // Si por algún motivo intentas asociar una misma mascota a un usuario y ya existe, tu índice unique evitará duplicado.
  await UsuarioMascota.insertMany(
    mascotasDocs.map((mascota) => ({
      id_usuario,
      id_mascota: mascota._id,
      activo: true,
    }))
  );

  // 5) Respuesta (puedes devolver en el mismo formato que el listado)
  return {
    cliente: {
      id: usuario._id,
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      numero_celular: usuario.numero_celular,
      rol: usuario.id_rol?.nombre,
    },
    mascotas: mascotasDocs.map((m) => ({
      id: m._id,
      nombre: m.nombre,
      edad: m.edad,
      peso: m.peso,
      sexo: m.sexo,
      raza: m.raza,
      tipo_mascota: m.tipo_mascota,
    })),
  };
}


   async eliminarPacientePorMascota(id_mascota) {
    // 1) Validar que exista mascota y no esté eliminada
    const mascota = await Mascota.findById(id_mascota).lean();
    if (!mascota || mascota.eliminado) {
      const error = new Error("Mascota no encontrada o ya eliminada");
      error.code = "MASCOTA_NO_ENCONTRADA";
      throw error;
    }

    // 2) Buscar relación activa de esa mascota
    const relacion = await UsuarioMascota.findOne({
      id_mascota,
      activo: true,
    }).lean();

    if (!relacion) {
      const error = new Error("No existe relación activa para esta mascota");
      error.code = "RELACION_NO_EXISTE";
      throw error;
    }

    const id_usuario = relacion.id_usuario;

    // 3) Desactivar relación (borrado lógico de la relación)
    await UsuarioMascota.updateOne(
      { _id: relacion._id },
      { $set: { activo: false } }
    );

    // 4) Marcar mascota como eliminada
    await Mascota.updateOne(
      { _id: id_mascota },
      { $set: { eliminado: true } }
    );

    // 5) Ver si el dueño tiene otras mascotas activas y no eliminadas
    // buscamos otras relaciones activas del mismo usuario
    const otrasRelaciones = await UsuarioMascota.find({
      id_usuario,
      activo: true,
    })
      .select("id_mascota")
      .lean();

    // si no hay relaciones activas -> dueño se elimina
    // si hay, verificamos que esas mascotas sigan no eliminadas
    let tieneOtraMascotaActiva = false;

    if (otrasRelaciones.length > 0) {
      const idsMascotas = otrasRelaciones.map((r) => r.id_mascota);

      const mascotasNoEliminadas = await Mascota.countDocuments({
        _id: { $in: idsMascotas },
        eliminado: false,
      });

      tieneOtraMascotaActiva = mascotasNoEliminadas > 0;
    }

    // 6) Si no tiene más mascotas activas, borrar lógico del usuario
    let duenoEliminado = false;
    if (!tieneOtraMascotaActiva) {
      await User.updateOne(
        { _id: id_usuario },
        { $set: { eliminado: true } }
      );
      duenoEliminado = true;
    }

    return {
      message: "Paciente eliminado lógicamente",
      id_mascota,
      id_usuario,
      duenoEliminado,
    };
  }
}

module.exports = new PacienteService();
