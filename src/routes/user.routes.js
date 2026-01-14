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


module.exports = router;
