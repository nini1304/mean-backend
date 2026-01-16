const express = require("express");
const router = express.Router();
const controller = require("../controllers/paciente.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// POST /api/pacientes
// Normalmente solo ADMIN/OPERADOR registra pacientes en clínica
router.post(
  "/",
  autenticarJWT,
  requerirRol(["RECEPCIONISTA"]),
  controller.registrarClienteConMascotas
);

router.post(
  "/:idUsuario/mascotas",
  autenticarJWT,
  requerirRol(["RECEPCIONISTA"]),
  controller.registrarMascotasParaClienteExistente
);

router.delete(
  "/:idMascota",
  autenticarJWT,
  requerirRol(["RECEPCIONISTA"]),
  controller.eliminarPaciente
);

router.put(
  "/:idMascota",
  autenticarJWT,
  requerirRol(["RECEPCIONISTA"]),
  controller.actualizarPacientePorMascota
);


module.exports = router;
