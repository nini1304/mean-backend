const usuarioMascotaService = require("../services/usuario_mascota.service");

exports.listarMascotasConDueno = async (req, res) => {
  try {
    const data = await usuarioMascotaService.listarMascotasConDueno();
    res.json(data);
  } catch (error) {
    console.error("Error al listar mascotas con dueño:", error);
    res.status(500).json({ message: "Error al listar mascotas con dueño" });
  }
};
