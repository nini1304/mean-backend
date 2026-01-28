const express = require("express");
const router = express.Router();
const controller = require("../controllers/veterinario.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// POST /api/veterinarios (solo ADMIN)
router.post("/", controller.crearVeterinario);

// GET /api/veterinarios (ADMIN u OPERADOR, ajusta a tu gusto)
router.get("/", controller.listarVeterinarios);router.get(
  "/",
  controller.listarVeterinarios
);

// DELETE lógico /api/veterinarios/:id (solo ADMIN)
router.delete("/:id", autenticarJWT, requerirRol(["ADMIN"]), controller.eliminarVeterinario);

router.post("/completo", controller.crearVeterinarioCompleto);

// GET /api/veterinarios/con-horarios?soloActivos=true
router.get("/con-horarios", controller.listarVeterinariosConHorarios);

module.exports = router;
