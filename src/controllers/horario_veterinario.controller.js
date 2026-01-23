const service = require("../services/horario_veterinario.service");

exports.guardarHorario = async (req, res) => {
  try {
    const creado = await service.guardarHorario(req.body);
    res.status(201).json({ message: "Horario guardado", data: creado });
  } catch (error) {
    console.error("Error guardando horario:", error);

    if (error.code === "VALIDACION") return res.status(400).json({ message: error.message });
    if (error.code === "VET_NO_ENCONTRADO") return res.status(404).json({ message: error.message });

    res.status(500).json({ message: "Error al guardar horario" });
  }
};

exports.listarPorVeterinario = async (req, res) => {
  try {
    const { id_veterinario } = req.params;
    const lista = await service.listarPorVeterinario(id_veterinario);
    res.json(lista);
  } catch (error) {
    console.error("Error listando horarios:", error);
    res.status(500).json({ message: "Error al listar horarios" });
  }
};

exports.listarTodos = async (req, res) => {
  try {
    const lista = await service.listarTodos();
    res.json(lista);
  } catch (error) {
    console.error("Error listando horarios:", error);
    res.status(500).json({ message: "Error al listar horarios" });
  }
};

exports.desactivarHorario = async (req, res) => {
  try {
    const { id_veterinario, dia_semana } = req.params;
    const actualizado = await service.desactivarHorario(id_veterinario, dia_semana);
    res.json({ message: "Horario desactivado", data: actualizado });
  } catch (error) {
    console.error("Error desactivando horario:", error);

    if (error.code === "VALIDACION") return res.status(400).json({ message: error.message });
    if (error.code === "NO_ENCONTRADO") return res.status(404).json({ message: error.message });

    res.status(500).json({ message: "Error al desactivar horario" });
  }
};

exports.borrarLogico = async (req, res) => {
  try {
    const { id_veterinario, dia_semana } = req.params;
    const actualizado = await service.borrarLogico(id_veterinario, dia_semana);
    res.json({ message: "Horario eliminado lógicamente", data: actualizado });
  } catch (error) {
    console.error("Error borrando horario:", error);

    if (error.code === "VALIDACION") return res.status(400).json({ message: error.message });
    if (error.code === "NO_ENCONTRADO") return res.status(404).json({ message: error.message });

    res.status(500).json({ message: "Error al eliminar horario" });
  }
};
