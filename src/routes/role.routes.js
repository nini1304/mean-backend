// src/routes/role.routes.js
const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");

// POST /api/roles
router.post("/", roleController.crearRol);

// GET /api/roles
router.get("/", roleController.listarRoles);

module.exports = router;
