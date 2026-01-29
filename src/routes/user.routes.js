const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");

// POST /api/users
router.post("/", userController.crearUsuario);

// GET /api/users
router.get(
  "/",

  userController.listarUsuarios
);

router.get(
    "/clientes",
   
      userController.listarDuenos);

router.get(
  "/clientes-activos",
  autenticarJWT,
  requerirRol(["ADMIN","RECEPCIONISTA","VETERINARIO"]),
  userController.listarClientesActivos
);

// GET /api/users/activos-sin-veterinario
router.get("/activos-sin-veterinario",
  autenticarJWT,
  requerirRol(["ADMIN"]),
  userController.listarUsuariosActivosSinVeterinario);

// POST /api/users/crear-contrasena
router.post("/crear-contrasena",
  autenticarJWT,
  requerirRol(["ADMIN"]),
  userController.crearUsuarioConContrasena);

router.put("/:id",
  autenticarJWT,
  requerirRol(["ADMIN"]),
  userController.actualizarUsuario);


router.delete("/:id",
  autenticarJWT,
  requerirRol(["ADMIN"]),
  userController.eliminarUsuarioLogico);


module.exports = router;
