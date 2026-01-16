const express = require("express");
const router = express.Router();
const controller = require("../controllers/usuario_mascota.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// GET /api/usuario-mascota/mascotas
// (si quieres que solo ADMIN liste todo)
router.get(
  "/mascotas",
  autenticarJWT,
  requerirRol(["RECEPCIONISTA"]),
  controller.listarMascotasConDueno
);

module.exports = router;
