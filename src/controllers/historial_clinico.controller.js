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

// ===========================
//   SECCIONES SIN ARCHIVOS
// ===========================

exports.agregarConsulta = async (req, res) => {
  try {
    const { id_mascota } = req.params;

    const actualizado = await historialService.agregarConsulta(id_mascota, req.body);

    return res.status(201).json({
      message: "Consulta agregada",
      historial: actualizado,
    });
  } catch (error) {
    console.error("Error agregarConsulta:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === "VALIDACION") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error al agregar consulta" });
  }
};

exports.agregarVacuna = async (req, res) => {
  try {
    const { id_mascota } = req.params;

    const actualizado = await historialService.agregarVacuna(id_mascota, req.body);

    return res.status(201).json({
      message: "Vacuna agregada",
      historial: actualizado,
    });
  } catch (error) {
    console.error("Error agregarVacuna:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === "VALIDACION") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error al agregar vacuna" });
  }
};

exports.agregarDesparasitacion = async (req, res) => {
  try {
    const { id_mascota } = req.params;

    const actualizado = await historialService.agregarDesparasitacion(id_mascota, req.body);

    return res.status(201).json({
      message: "Desparasitación agregada",
      historial: actualizado,
    });
  } catch (error) {
    console.error("Error agregarDesparasitacion:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === "VALIDACION") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error al agregar desparasitación" });
  }
};

exports.agregarProcedimiento = async (req, res) => {
  try {
    const { id_mascota } = req.params;

    const actualizado = await historialService.agregarProcedimiento(id_mascota, req.body);

    return res.status(201).json({
      message: "Procedimiento agregado",
      historial: actualizado,
    });
  } catch (error) {
    console.error("Error agregarProcedimiento:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === "VALIDACION") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error al agregar procedimiento" });
  }
};

// ===========================
//   EXÁMENES CON ARCHIVOS
// ===========================

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
