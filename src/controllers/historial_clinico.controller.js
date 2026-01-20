const historialService = require("../services/historial_clinico.service");

exports.initHistorial = async (req, res) => {
  try {
    const { id_mascota } = req.params;
    const historial = await historialService.crearHistorialSiNoExiste(id_mascota);
    res.status(201).json({ message: "Historial listo", historial });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al crear historial" });
  }
};

exports.subirExamenAdjunto = async (req, res) => {
  try {
    const { id_mascota } = req.params;

    // estos vienen como texto en multipart/form-data
    const examen = {
      tipo: req.body.tipo,
      fecha: req.body.fecha,
      resultado: req.body.resultado,
      id_veterinario: req.body.id_veterinario || null,
      // valores opcional: puedes mandarlo como JSON string
      valores: req.body.valores ? JSON.parse(req.body.valores) : null,
    };

    if (!examen.tipo) {
      return res.status(400).json({ message: "El campo 'tipo' es obligatorio" });
    }

    const result = await historialService.subirAdjuntoAExamen({
      id_mascota,
      examen,
      file: req.file,
    });

    res.status(201).json({
      message: "Examen registrado con adjunto",
      adjunto: result.adjunto,
    });
  } catch (e) {
    console.error("Error subir examen:", e);
    res.status(500).json({ message: "Error al subir examen" });
  }
};

exports.obtenerPorMascota = async (req, res) => {
  try {
    const { id_mascota } = req.params;

    const historial = await historialService.obtenerPorMascota(id_mascota, {
      crearSiNoExiste: true,
    });

    res.json(historial);
  } catch (error) {
    console.error("Error obteniendo historial:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al obtener historial clínico" });
  }
};
