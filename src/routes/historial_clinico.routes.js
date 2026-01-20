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

// ===========================
//   SECCIONES (JSON)
// ===========================

router.post(
  "/:id_mascota/consultas",
  // autenticarJWT,
  // requerirRol(["ADMIN", "VET", "OPERADOR"]),
  controller.agregarConsulta
);

router.post(
  "/:id_mascota/vacunas",
  // autenticarJWT,
  // requerirRol(["ADMIN", "VET", "OPERADOR"]),
  controller.agregarVacuna
);

router.post(
  "/:id_mascota/desparasitaciones",
  // autenticarJWT,
  // requerirRol(["ADMIN", "VET", "OPERADOR"]),
  controller.agregarDesparasitacion
);

router.post(
  "/:id_mascota/procedimientos",
  // autenticarJWT,
  // requerirRol(["ADMIN", "VET", "OPERADOR"]),
  controller.agregarProcedimiento
);

// ===========================
//   EXÁMENES (multipart)
// ===========================

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
