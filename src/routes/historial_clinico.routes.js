const express = require("express");
const router = express.Router();
const controller = require("../controllers/historial_clinico.controller");
const { upload } = require("../middlewares/upload.middleware");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// Crear/asegurar historial
router.post(
  "/:id_mascota/init",
//   autenticarJWT,
//   requerirRol(["ADMIN", "VET", "OPERADOR"]),
  controller.initHistorial
);

// Subir examen con adjunto (multipart/form-data)
router.post(
  "/:id_mascota/examenes/upload",
//   autenticarJWT,
//   requerirRol(["ADMIN", "VET", "OPERADOR"]),
  upload.single("archivo"),
  controller.subirExamenAdjunto
);

router.get(
  "/:id_mascota",
//   autenticarJWT,
//   requerirRol(["ADMIN", "VET", "OPERADOR"]),
  controller.obtenerPorMascota
);


module.exports = router;
