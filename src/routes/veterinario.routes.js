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

router.post("/completo",
   autenticarJWT,
  requerirRol(["ADMIN"]),
   controller.crearVeterinarioCompleto);

// GET /api/veterinarios/con-horarios?soloActivos=true
router.get("/con-horarios",
  autenticarJWT,
  requerirRol(["ADMIN"]),
  controller.listarVeterinariosConHorarios);

router.put("/:id",
   autenticarJWT,
  requerirRol(["ADMIN"]),
  controller.actualizarVeterinarioCompleto);

router.delete("/:id",
   autenticarJWT,
  requerirRol(["ADMIN"]),
   controller.eliminarLogico);



module.exports = router;
