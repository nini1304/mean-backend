const express = require("express");
const router = express.Router();
const controller = require("../controllers/paciente.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// POST /api/pacientes
// Normalmente solo ADMIN/OPERADOR registra pacientes en clínica
router.post(
  "/",
//   autenticarJWT,
//   requerirRol(["ADMIN"]),
  controller.registrarClienteConMascotas
);

module.exports = router;
