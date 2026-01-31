const express = require("express");
const router = express.Router();
const controller = require("../controllers/veterinario.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// POST /api/veterinarios (solo ADMIN)
router.post("/", controller.crearVeterinario);




router.get(
  "/",
  autenticarJWT,
    requerirRol(["RECEPCIONISTA","VETERINARIO"]),
  controller.listarVeterinarios
);



router.post("/completo",
   autenticarJWT,
  requerirRol(["ADMIN"]),
   controller.crearVeterinarioCompleto);

// GET /api/veterinarios/con-horarios?soloActivos=true
router.get("/con-horarios",
  autenticarJWT,
  requerirRol(["ADMIN","RECEPCIONISTA"]),
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
