// src/services/role.service.js
const Role = require("../models/role.model");

class RoleService {
  async crearRol(nombre) {
    // Podrías poner más lógica aquí si quieres
    const rol = await Role.create({ nombre });
    return rol;
  }

  async listarRoles() {
    // .lean() devuelve objetos planos JS, no documentos Mongoose
    return await Role.find().lean();
  }

  async obtenerPorId(id) {
    return await Role.findById(id).lean();
  }

  async listarRolesSinVeterinario() {
    return await Role.find({
      nombre: { $nin: ["VETERINARIO", "CLIENTE"] }
    })
      .sort({ nombre: 1 })
      .lean();
  }


}

module.exports = new RoleService();
