const mascotaService = require("../services/mascota.service");

exports.crearMascota = async (req, res) => {
  try {
    const { nombre, tipo_mascota, edad, peso, sexo, raza } = req.body;

    if (!nombre || !tipo_mascota || edad === undefined || peso === undefined || !sexo || !raza) {
      return res.status(400).json({
        message:
          "Campos obligatorios: 'nombre', 'tipo_mascota', 'edad', 'peso', 'sexo', 'raza'",
      });
    }

    const creada = await mascotaService.crearMascota({
      nombre,
      tipo_mascota,
      edad,
      peso,
      sexo,
      raza,
    });

    res.status(201).json(creada);
  } catch (error) {
    console.error("Error al crear mascota:", error);
    res.status(500).json({ message: "Error al crear mascota" });
  }
};

exports.listarMascotas = async (req, res) => {
  try {
    const mascotas = await mascotaService.listarMascotas();
    res.json(mascotas);
  } catch (error) {
    console.error("Error al listar mascotas:", error);
    res.status(500).json({ message: "Error al listar mascotas" });
  }
};

exports.obtenerMascotaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const mascota = await mascotaService.obtenerPorId(id);

    if (!mascota) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    res.json(mascota);
  } catch (error) {
    console.error("Error al obtener mascota:", error);
    res.status(500).json({ message: "Error al obtener mascota" });
  }
};

exports.actualizarMascota = async (req, res) => {
  try {
    const { id } = req.params;

    const actualizada = await mascotaService.actualizarMascota(id, req.body);

    if (!actualizada) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    res.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar mascota:", error);
    res.status(500).json({ message: "Error al actualizar mascota" });
  }
};

exports.borrarMascotaLogico = async (req, res) => {
  try {
    const { id } = req.params;

    const borrada = await mascotaService.borrarLogico(id);

    if (!borrada) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    res.json({ message: "Mascota eliminada lógicamente" });
  } catch (error) {
    console.error("Error al borrar mascota:", error);
    res.status(500).json({ message: "Error al borrar mascota" });
  }
};
