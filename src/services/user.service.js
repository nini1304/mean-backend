const User = require("../models/user.model");
const Role = require("../models/role.model");


class UserService {
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


  
}

module.exports = new UserService();
