const express = require("express");
const router = express.Router();
const c = require("../controllers/cita.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// FullCalendar: GET por rango (start/end ISO)
// Ej: /api/citas?start=2026-01-01T00:00:00.000Z&end=2026-01-31T23:59:59.999Z&id_veterinario=...
router.get("/",
    autenticarJWT,
    requerirRol(["RECEPCIONISTA"]),
    c.listarPorRango);

// Crear
router.post("/",
    autenticarJWT,
    requerirRol(["RECEPCIONISTA"]),
    c.crearCita);

// Editar (drag&drop/resize)
router.put("/:id_cita",
    autenticarJWT,
    requerirRol(["RECEPCIONISTA"]),
    c.actualizarCita);

// Cancelar (estado = CANCELADA)
router.patch("/:id_cita/cancelar",
    autenticarJWT,
    requerirRol(["RECEPCIONISTA"]),
    c.cancelarCita);

// Borrado lógico
router.delete("/:id_cita", c.borrarLogico);

router.patch("/:id_cita/estado",
    autenticarJWT,
    requerirRol(["RECEPCIONISTA"]),
    c.cambiarEstado);


module.exports = router;
