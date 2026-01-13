const express = require("express");
const router = express.Router();
const mascotaController = require("../controllers/mascota.controller");

// POST /api/mascotas
router.post("/", mascotaController.crearMascota);

// GET /api/mascotas
router.get("/", mascotaController.listarMascotas);

// GET /api/mascotas/:id
router.get("/:id", mascotaController.obtenerMascotaPorId);

// PUT /api/mascotas/:id
router.put("/:id", mascotaController.actualizarMascota);

// DELETE /api/mascotas/:id  (borrado lógico)
router.delete("/:id", mascotaController.borrarMascotaLogico);

module.exports = router;
