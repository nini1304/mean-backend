const agendaService = require("../services/agenda.service");

exports.listarEventos = async (req, res) => {
  try {
    const { id_veterinario, from, to } = req.query;

    const eventos = await agendaService.listarEventos({ id_veterinario, from, to });
    res.json(eventos);
  } catch (error) {
    console.error("Error listando eventos:", error);

    if (error.code === "VALIDACION") return res.status(400).json({ message: error.message });
    if (error.code === "VET_NO_ENCONTRADO") return res.status(404).json({ message: error.message });

    res.status(500).json({ message: "Error al listar eventos" });
  }
};
