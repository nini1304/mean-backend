const express = require("express");
const router = express.Router();
const tipoMascotaController = require("../controllers/tipo_mascota.controller");

// POST /api/tipo-mascota
router.post("/", tipoMascotaController.crearTipoMascota);

// GET /api/tipo-mascota
router.get("/", tipoMascotaController.listarTiposMascota);

module.exports = router;
