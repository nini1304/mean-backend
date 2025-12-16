const express = require("express");
const router = express.Router();
const contrasenaController = require("../controllers/contrasena.controller");

// Guardar o actualizar contraseña de un usuario
// POST /api/contrasenas
router.post("/", contrasenaController.guardarContrasena);

// Validar contraseña (ej: login básico)
// POST /api/contrasenas/validar
router.post("/validar", contrasenaController.validarContrasena);

module.exports = router;
