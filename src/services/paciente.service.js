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

  async actualizarPacientePorMascota(id_mascota, payload) {
  const { mascota, dueno } = payload;

  // 1) Validar mascota exista y esté activa
  const mascotaActual = await Mascota.findOne({ _id: id_mascota, eliminado: false }).lean();
  if (!mascotaActual) {
    const error = new Error("Mascota no encontrada o eliminada");
    error.code = "MASCOTA_NO_ENCONTRADA";
    throw error;
  }

  // 2) Buscar relación activa para obtener dueño
  const relacion = await UsuarioMascota.findOne({ id_mascota, activo: true }).lean();
  if (!relacion) {
    const error = new Error("No existe relación activa para esta mascota");
    error.code = "RELACION_NO_EXISTE";
    throw error;
  }

  const id_usuario = relacion.id_usuario;

  // 3) Actualizar mascota (solo campos permitidos)
  if (mascota) {
    const updateMascota = {};
    const allowedMascota = ["nombre", "tipo_mascota", "edad", "peso", "sexo", "raza"];

    for (const key of allowedMascota) {
      if (mascota[key] !== undefined) updateMascota[key] = mascota[key];
    }

    if (Object.keys(updateMascota).length > 0) {
      await Mascota.updateOne(
        { _id: id_mascota, eliminado: false },
        { $set: updateMascota }
      );
    }
  }

  // 4) Actualizar dueño (User) (solo campos permitidos)
  if (dueno) {
    const updateDueno = {};
    const allowedDueno = ["nombre_completo", "correo", "numero_celular"];

    for (const key of allowedDueno) {
      if (dueno[key] !== undefined) updateDueno[key] = dueno[key];
    }

    // Si se intenta actualizar correo, respeta unique. Si choca, Mongo tirará error 11000.
    if (Object.keys(updateDueno).length > 0) {
      await User.updateOne(
        { _id: id_usuario, eliminado: false },
        { $set: updateDueno }
      );
    }
  }

  // 5) Devolver el “paciente” actualizado ya listo para la tabla
  const actualizado = await UsuarioMascota.findOne({ id_mascota, activo: true })
    .populate({ path: "id_usuario", select: "nombre_completo correo numero_celular eliminado" })
    .populate({
      path: "id_mascota",
      match: { eliminado: false },
      populate: { path: "tipo_mascota", select: "tipo_mascota" },
    })
    .lean();

  if (!actualizado || !actualizado.id_mascota) {
    const error = new Error("No se pudo obtener el paciente actualizado");
    error.code = "ACTUALIZACION_FALLO";
    throw error;
  }

  return {
    id_relacion: actualizado._id,
    activo: actualizado.activo,
    mascota: {
      id: actualizado.id_mascota._id,
      nombre: actualizado.id_mascota.nombre,
      edad: actualizado.id_mascota.edad,
      peso: actualizado.id_mascota.peso,
      sexo: actualizado.id_mascota.sexo,
      raza: actualizado.id_mascota.raza,
      tipo_mascota: actualizado.id_mascota.tipo_mascota?.tipo_mascota,
      id_tipo_mascota: actualizado.id_mascota.tipo_mascota?._id,
    },
    dueno: {
      id: actualizado.id_usuario?._id,
      nombre_completo: actualizado.id_usuario?.nombre_completo,
      correo: actualizado.id_usuario?.correo,
      numero_celular: actualizado.id_usuario?.numero_celular,
    },
    updatedAt: actualizado.updatedAt,
  };
}

}

module.exports = new PacienteService();
