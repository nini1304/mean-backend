const UsuarioMascota = require("../models/usuario_mascota.model");

class UsuarioMascotaService {
  // Lista todas las mascotas activas con su dueño asociado
  async listarMascotasConDueno() {
    const relaciones = await UsuarioMascota.find({ activo: true })
      .populate({
        path: "id_usuario",
        select: "nombre_completo correo numero_celular", // lo que quieres mostrar del dueño
      })
      .populate({
        path: "id_mascota",
        match: { eliminado: false }, // no traer mascotas borradas lógicamente
        populate: { path: "tipo_mascota", select: "tipo_mascota" },
      })
      .lean();

    // Cuando usamos "match", si una mascota está eliminada => id_mascota viene null
    const filtradas = relaciones.filter((r) => r.id_mascota);

    // Aplanar para que el front lo consuma fácil
    return filtradas.map((r) => ({
      id_relacion: r._id,
      activo: r.activo,

      mascota: {
        id: r.id_mascota._id,
        nombre: r.id_mascota.nombre,
        edad: r.id_mascota.edad,
        peso: r.id_mascota.peso,
        sexo: r.id_mascota.sexo,
        raza: r.id_mascota.raza,
        tipo_mascota: r.id_mascota.tipo_mascota?.tipo_mascota,
        id_tipo_mascota: r.id_mascota.tipo_mascota?._id,
      },

      dueno: {
        id: r.id_usuario?._id,
        nombre_completo: r.id_usuario?.nombre_completo,
        correo: r.id_usuario?.correo,
        numero_celular: r.id_usuario?.numero_celular,
      },

      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  // (opcional) listar mascotas de un dueño específico
  async listarMascotasPorDueno(id_usuario) {
    const relaciones = await UsuarioMascota.find({ id_usuario, activo: true })
      .populate({
        path: "id_usuario",
        select: "nombre_completo correo numero_celular",
      })
      .populate({
        path: "id_mascota",
        match: { eliminado: false },
        populate: { path: "tipo_mascota", select: "tipo_mascota" },
      })
      .lean();

    const filtradas = relaciones.filter((r) => r.id_mascota);

    return filtradas.map((r) => ({
      id_relacion: r._id,
      mascota: r.id_mascota,
      dueno: r.id_usuario,
    }));
  }
}

module.exports = new UsuarioMascotaService();
