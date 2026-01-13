const tipoMascotaService = require("../services/tipo_mascota.service");

exports.crearTipoMascota = async (req, res) => {
  try {
    const { tipo_mascota } = req.body;

    if (!tipo_mascota) {
      return res.status(400).json({
        message: "El campo 'tipo_mascota' es obligatorio",
      });
    }

    const creado = await tipoMascotaService.crearTipoMascota({ tipo_mascota });

    res.status(201).json(creado);
  } catch (error) {
    console.error("Error al crear tipo_mascota:", error);

    // Si pusiste unique: true en el schema, esto captura duplicados
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Ese tipo de mascota ya existe" });
    }

    res.status(500).json({ message: "Error al crear tipo de mascota" });
  }
};

exports.listarTiposMascota = async (req, res) => {
  try {
    const tipos = await tipoMascotaService.listarTiposMascota();
    res.json(tipos);
  } catch (error) {
    console.error("Error al listar tipos_mascota:", error);
    res.status(500).json({ message: "Error al listar tipos de mascota" });
  }
};
