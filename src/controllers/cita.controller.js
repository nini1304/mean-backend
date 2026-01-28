const citaService = require("../services/cita.service");

exports.listarPorRango = async (req, res) => {
  try {
    const { start, end, id_veterinario } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Query params requeridos: start, end" });
    }

    const data = await citaService.listarPorRango({ start, end, id_veterinario });
    res.json(data);
  } catch (error) {
    console.error("Error listando citas:", error);
    if (error.code === "VALIDACION") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: "Error al listar citas" });
  }
};

exports.crearCita = async (req, res) => {
  try {
    const creado = await citaService.crearCita(req.body);
    res.status(201).json({ message: "Cita creada", data: creado });
  } catch (error) {
    console.error("Error creando cita:", error);

    const map = {
      VALIDACION: 400,
      VET_NO_ENCONTRADO: 404,
      MASCOTA_NO_ENCONTRADA: 404,
      FUERA_DE_HORARIO: 400,
      SOLAPAMIENTO: 409,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });
    res.status(500).json({ message: "Error al crear cita" });
  }
};

exports.actualizarCita = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const actualizado = await citaService.actualizarCita(id_cita, req.body);
    res.json({ message: "Cita actualizada", data: actualizado });
  } catch (error) {
    console.error("Error actualizando cita:", error);

    const map = {
      VALIDACION: 400,
      NO_ENCONTRADO: 404,
      SOLAPAMIENTO: 409,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });
    res.status(500).json({ message: "Error al actualizar cita" });
  }
};

exports.cancelarCita = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const { motivo } = req.body || {};
    const actualizado = await citaService.cancelarCita(id_cita, motivo || "");
    res.json({ message: "Cita cancelada", data: actualizado });
  } catch (error) {
    console.error("Error cancelando cita:", error);
    if (error.code === "NO_ENCONTRADO") return res.status(404).json({ message: error.message });
    res.status(500).json({ message: "Error al cancelar cita" });
  }
};

exports.borrarLogico = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const actualizado = await citaService.borrarLogico(id_cita);
    res.json({ message: "Cita eliminada lógicamente", data: actualizado });
  } catch (error) {
    console.error("Error borrando cita:", error);
    if (error.code === "NO_ENCONTRADO") return res.status(404).json({ message: error.message });
    res.status(500).json({ message: "Error al eliminar cita" });
  }
};


exports.cambiarEstado = async (req, res) => {
  try {
    const { id_cita } = req.params;
    const { estado } = req.body;

    if (!estado) return res.status(400).json({ message: "Campo requerido: estado" });

    const actualizado = await citaService.cambiarEstado(id_cita, estado);
    res.json({ message: "Estado actualizado", data: actualizado });
  } catch (error) {
    console.error("Error cambiando estado:", error);

    const map = {
      VALIDACION: 400,
      NO_ENCONTRADO: 404,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });
    res.status(500).json({ message: "Error al cambiar estado" });
  }
};
