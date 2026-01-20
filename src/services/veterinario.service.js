const Veterinario = require("../models/veterinario.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");

class VeterinarioService {
  async crearVeterinario({ id_usuario, especialidad }) {
    // 1) validar usuario existe y no está eliminado
    const user = await User.findOne({ _id: id_usuario, eliminado: false })
      .populate("id_rol", "nombre")
      .lean();

    if (!user) {
      const err = new Error("Usuario no encontrado o eliminado");
      err.code = "USUARIO_NO_ENCONTRADO";
      throw err;
    }

    // 2) (recomendado) validar que el usuario tenga rol VETERINARIO
    // Cambia "VETERINARIO" por el nombre exacto que tengas en tu BD (ej: "VET")
    if (user.id_rol?.nombre !== "VETERINARIO") {
      const err = new Error("El usuario no tiene rol VETERINARIO");
      err.code = "USUARIO_NO_ES_VETERINARIO";
      throw err;
    }

    // 3) crear (o evitar duplicado si ya existe)
    try {
      const creado = await Veterinario.create({
        id_usuario,
        especialidad,
        eliminado: false,
      });

      return await Veterinario.findById(creado._id)
        .populate("id_usuario", "nombre_completo correo numero_celular")
        .lean();
    } catch (error) {
      // perfil ya existe para ese usuario (unique: true)
      if (error.code === 11000) {
        const err = new Error("Este usuario ya tiene un perfil de veterinario");
        err.code = "VETERINARIO_YA_EXISTE";
        throw err;
      }
      throw error;
    }
  }

  async listarVeterinarios() {
    const veterinarios = await Veterinario.find({ eliminado: false })
      .populate({
        path: "id_usuario",
        match: { eliminado: false },
        select: "nombre_completo correo numero_celular",
      })
      .lean();

    // Por seguridad, filtrar si el usuario fue eliminado
    return veterinarios
      .filter((v) => v.id_usuario)
      .map((v) => ({
        id: v._id,
        especialidad: v.especialidad,
        usuario: {
          id: v.id_usuario._id,
          nombre_completo: v.id_usuario.nombre_completo,
          correo: v.id_usuario.correo,
          numero_celular: v.id_usuario.numero_celular,
        },
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }));
  }


  async obtenerPorId(id_veterinario) {
    const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false })
      .populate("id_usuario", "nombre_completo correo numero_celular")
      .lean();

    if (!vet) {
      const err = new Error("Veterinario no encontrado");
      err.code = "VETERINARIO_NO_ENCONTRADO";
      throw err;
    }

    return vet;
  }

  async eliminarLogico(id_veterinario) {
    const actualizado = await Veterinario.findByIdAndUpdate(
      id_veterinario,
      { eliminado: true },
      { new: true }
    ).lean();

    if (!actualizado) {
      const err = new Error("Veterinario no encontrado");
      err.code = "VETERINARIO_NO_ENCONTRADO";
      throw err;
    }

    return actualizado;
  }
}

module.exports = new VeterinarioService();
