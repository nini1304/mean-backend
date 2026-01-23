const express = require("express");
const router = express.Router();
const c = require("../controllers/cita.controller");

// FullCalendar: GET por rango (start/end ISO)
// Ej: /api/citas?start=2026-01-01T00:00:00.000Z&end=2026-01-31T23:59:59.999Z&id_veterinario=...
router.get("/", c.listarPorRango);

// Crear
router.post("/", c.crearCita);

// Editar (drag&drop/resize)
router.put("/:id_cita", c.actualizarCita);

// Cancelar (estado = CANCELADA)
router.patch("/:id_cita/cancelar", c.cancelarCita);

// Borrado lógico
router.delete("/:id_cita", c.borrarLogico);

module.exports = router;
