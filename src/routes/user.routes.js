const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// POST /api/users
router.post("/", userController.crearUsuario);

// GET /api/users
router.get("/", userController.listarUsuarios);

module.exports = router;
