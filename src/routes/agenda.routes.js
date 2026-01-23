const express = require("express");
const router = express.Router();
const controller = require("../controllers/agenda.controller");

// GET /api/agenda/eventos?id_veterinario=...&from=...&to=...
router.get("/eventos", controller.listarEventos);

module.exports = router;
