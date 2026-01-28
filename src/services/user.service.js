const User = require("../models/user.model");
const Role = require("../models/role.model");
const contrasenaService = require("./contrasena.service");



class UserService {

    async crearUsuarioConContrasena(data) {
    const { nombre_completo, correo, numero_celular, id_rol, contrasena } = data;

    if (!nombre_completo || !correo || !numero_celular || !id_rol || !contrasena) {
      const err = new Error("Campos obligatorios: nombre_completo, correo, numero_celular, id_rol, contrasena");
      err.code = "VALIDACION";
      throw err;
    }

    // 1) Validar rol exista
    const rol = await Role.findById(id_rol).lean();
    if (!rol) {
      const err = new Error("Rol no encontrado");
      err.code = "ROL_NO_ENCONTRADO";
      throw err;
    }

    // 2) Validar correo único (mejor mensaje que el 11000)
    const existe = await User.findOne({ correo: correo.toLowerCase().trim() }).lean();
    if (existe) {
      const err = new Error("El correo ya está registrado");
      err.code = "CORREO_DUPLICADO";
      throw err;
    }

    // 3) Crear usuario
    const usuario = await User.create({
      nombre_completo: nombre_completo.trim(),
      correo: correo.toLowerCase().trim(),
      numero_celular: numero_celular.trim(),
      id_rol,
      eliminado: false,
    });

    // 4) Guardar contraseña (hash) como activa
    await contrasenaService.guardarContrasena(usuario._id, contrasena, "CREACION");

    // 5) Respuesta
    return await User.findById(usuario._id).populate("id_rol", "nombre").lean();
  }




  async crearUsuario(data) {
    const { nombre_completo, correo, numero_celular, id_rol } = data;

    // Aquí podrías validar más cosas si quieres
    const usuario = await User.create({
      nombre_completo,
      correo,
      numero_celular,
      id_rol,
    });

    // populate opcional si quieres devolver también info del rol
    return usuario.populate("id_rol", "nombre");
  }

  async listarUsuarios() {
    return await User.find()
      .populate("id_rol", "nombre") // Trae datos del rol, solo el campo nombre
      .lean();
  }

  async obtenerPorId(id) {
    return await User.findById(id)
      .populate("id_rol", "nombre")
      .lean();
  }

  async listarUsuariosPorRolNombre(nombreRol) {
    const rol = await Role.findOne({ nombre: nombreRol }).lean();

    if (!rol) {
      // devolvemos lista vacía si no existe el rol
      return [];
    }

    return await User.find({ id_rol: rol._id })
      .populate("id_rol", "nombre")
      .lean();
  }

  async listarClientesActivos() {
  const rolCliente = await Role.findOne({ nombre: "CLIENTE" }).lean();

  if (!rolCliente) return [];

  return await User.find({
    id_rol: rolCliente._id,
    eliminado: false,
  })
    .populate("id_rol", "nombre")
    .sort({ createdAt: -1 })
    .lean();
}

async listarUsuariosActivosSinVeterinario() {
  const rolVet = await Role.findOne({ nombre: "VETERINARIO" }).lean();

  // Si no existe el rol VETERINARIO, entonces no hay nada que excluir
  const filtro = {
    eliminado: false,
  };

  if (rolVet?._id) {
    filtro.id_rol = { $ne: rolVet._id };
  }

  return await User.find(filtro)
    .populate("id_rol", "nombre")
    .sort({ createdAt: -1 })
    .lean();
}


async actualizarUsuario(id_usuario, data) {
    // Solo permitimos estos campos
    const allowed = ["nombre_completo", "correo", "numero_celular", "id_rol"];
    const update = {};

    for (const k of allowed) {
      if (data[k] !== undefined) update[k] = data[k];
    }

    if (Object.keys(update).length === 0) {
      const err = new Error("No se enviaron campos para actualizar");
      err.code = "VALIDACION";
      throw err;
    }

    // Validar exista y no esté eliminado
    const actual = await User.findOne({ _id: id_usuario, eliminado: false }).lean();
    if (!actual) {
      const err = new Error("Usuario no encontrado o eliminado");
      err.code = "NO_ENCONTRADO";
      throw err;
    }

    // Si se actualiza rol, validar rol exista
    if (update.id_rol) {
      const rol = await Role.findById(update.id_rol).lean();
      if (!rol) {
        const err = new Error("Rol no encontrado");
        err.code = "ROL_NO_ENCONTRADO";
        throw err;
      }
    }

    // Si se actualiza correo, normalizar y validar duplicado
    if (update.correo) {
      update.correo = update.correo.toLowerCase().trim();

      const dup = await User.findOne({
        _id: { $ne: id_usuario },
        correo: update.correo,
      }).lean();

      if (dup) {
        const err = new Error("El correo ya está registrado por otro usuario");
        err.code = "CORREO_DUPLICADO";
        throw err;
      }
    }

    // Normalizar strings
    if (update.nombre_completo) update.nombre_completo = update.nombre_completo.trim();
    if (update.numero_celular) update.numero_celular = update.numero_celular.trim();

    const actualizado = await User.findOneAndUpdate(
      { _id: id_usuario, eliminado: false },
      { $set: update },
      { new: true }
    )
      .populate("id_rol", "nombre")
      .lean();

    return actualizado;
  }

  async eliminarUsuarioLogico(id_usuario) {
    const actualizado = await User.findOneAndUpdate(
      { _id: id_usuario, eliminado: false },
      { $set: { eliminado: true } },
      { new: true }
    )
      .populate("id_rol", "nombre")
      .lean();

    if (!actualizado) {
      const err = new Error("Usuario no encontrado o ya eliminado");
      err.code = "NO_ENCONTRADO";
      throw err;
    }

    return actualizado;
  }
}

module.exports = new UserService();
