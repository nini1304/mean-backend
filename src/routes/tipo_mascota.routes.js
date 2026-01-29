const express = require("express");
const router = express.Router();
const tipoMascotaController = require("../controllers/tipo_mascota.controller");
const { autenticarJWT } = require("../middlewares/auth.middleware");
const { requerirRol } = require("../middlewares/role.middleware");
// POST /api/tipo-mascota
router.post("/", tipoMascotaController.crearTipoMascota);

// GET /api/tipo-mascota
router.get("/",
    autenticarJWT,
    requerirRol(["ADMIN","RECEPCIONISTA","VETERINARIO"]),
     tipoMascotaController.listarTiposMascota);

module.exports = router;
