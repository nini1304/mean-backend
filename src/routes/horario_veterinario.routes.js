const express = require("express");
const router = express.Router();
const c = require("../controllers/horario_veterinario.controller");

// Guardar (crea o actualiza por (id_veterinario, dia_semana))
router.post("/", c.guardarHorario);

// Listar horarios de un veterinario
router.get("/veterinario/:id_veterinario", c.listarPorVeterinario);

// (opcional) listar todos
router.get("/", c.listarTodos);

// Desactivar (activo=false) por veterinario+día
router.patch("/veterinario/:id_veterinario/dia/:dia_semana/desactivar", c.desactivarHorario);

// Borrado lógico (eliminado=true) por veterinario+día
router.delete("/veterinario/:id_veterinario/dia/:dia_semana", c.borrarLogico);

module.exports = router;
