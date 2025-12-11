// src/controllers/role.controller.js
const roleService = require("../services/role.service");

exports.crearRol = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El campo 'nombre' es obligatorio" });
    }

    const rol = await roleService.crearRol(nombre);
    res.status(201).json(rol);
  } catch (error) {
    console.error("Error al crear rol:", error);
    res.status(500).json({ message: "Error al crear rol" });
  }
};

exports.listarRoles = async (req, res) => {
  try {
    const roles = await roleService.listarRoles();
    res.json(roles);
  } catch (error) {
    console.error("Error al listar roles:", error);
    res.status(500).json({ message: "Error al listar roles" });
  }
};
