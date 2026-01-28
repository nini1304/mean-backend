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
  autenticarJWT,
  requerirRol(["ADMIN"]),
  userController.listarUsuarios
);

router.get(
    "/clientes",
    //  autenticarJWT, 
    //  requerirRol(["ADMIN"]),
      userController.listarDuenos);

router.get(
  "/clientes-activos",
//   autenticarJWT,
//   requerirRol(["ADMIN"]),
  userController.listarClientesActivos
);

// GET /api/users/activos-sin-veterinario
router.get("/activos-sin-veterinario", userController.listarUsuariosActivosSinVeterinario);

// POST /api/users/crear-contrasena
router.post("/crear-contrasena", userController.crearUsuarioConContrasena);

router.put("/:id", userController.actualizarUsuario);
router.delete("/:id", userController.eliminarUsuarioLogico);


module.exports = router;
