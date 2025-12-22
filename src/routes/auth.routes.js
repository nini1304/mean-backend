// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/forgot-password
router.post("/forgot-password", authController.solicitarResetContrasena);

module.exports = router;
