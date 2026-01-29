const express = require("express");
const router = express.Router();
const c = require("../controllers/historial_clinico.controller");
const controller = require("../controllers/historial_clinico.controller");
const { upload } = require("../middlewares/upload.middleware");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// Crear/asegurar historial
router.post(
  "/:id_mascota/init",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  controller.initHistorial
);

// ===========================
//   SECCIONES (JSON)
// ===========================

router.post(
  "/:id_mascota/consultas",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  controller.agregarConsulta
);

router.post(
  "/:id_mascota/vacunas",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  controller.agregarVacuna
);

router.post(
  "/:id_mascota/desparasitaciones",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  controller.agregarDesparasitacion
);

router.post(
  "/:id_mascota/procedimientos",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  controller.agregarProcedimiento
);

// ===========================
//   EXÁMENES (multipart)
// ===========================

// Subir examen con adjunto (multipart/form-data)
router.post(
  "/:id_mascota/examenes/upload",
autenticarJWT,
  requerirRol(["VETERINARIO"]),
  upload.single("archivo"),
  controller.subirExamenAdjunto
);

router.get(
  "/:id_mascota",
autenticarJWT,
  requerirRol(["VETERINARIO"]),
  controller.obtenerPorMascota
);


// PUT = actualizar
router.put("/:id_mascota/consultas/:id_consulta",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  c.actualizarConsulta);
router.put("/:id_mascota/vacunas/:id_vacuna",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  c.actualizarVacuna);
router.put("/:id_mascota/desparasitaciones/:id_desparasitacion",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  c.actualizarDesparasitacion);
router.put("/:id_mascota/procedimientos/:id_procedimiento",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  c.actualizarProcedimiento);
router.put("/:id_mascota/examenes/:id_examen",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  c.actualizarExamen);

// subir adjunto a un examen existente (multipart)
router.post(
  "/:id_mascota/examenes/:id_examen/adjuntos",
  autenticarJWT,
  requerirRol(["VETERINARIO"]),
  upload.single("archivo"),
  c.subirAdjuntoAExamenExistente
);

module.exports = router;
