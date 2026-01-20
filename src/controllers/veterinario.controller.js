const veterinarioService = require("../services/veterinario.service");

exports.crearVeterinario = async (req, res) => {
  try {
    const { id_usuario, especialidad } = req.body;

    if (!id_usuario || !especialidad) {
      return res.status(400).json({
        message: "Los campos 'id_usuario' y 'especialidad' son obligatorios",
      });
    }

    const creado = await veterinarioService.crearVeterinario({ id_usuario, especialidad });

    res.status(201).json({
      message: "Veterinario creado correctamente",
      data: creado,
    });
  } catch (error) {
    console.error("Error al crear veterinario:", error);

    if (error.code === "USUARIO_NO_ENCONTRADO") {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === "USUARIO_NO_ES_VETERINARIO") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === "VETERINARIO_YA_EXISTE") {
      return res.status(409).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al crear veterinario" });
  }
};

exports.listarVeterinarios = async (req, res) => {
  try {
    const veterinarios = await veterinarioService.listarVeterinarios();
    res.json(veterinarios);
  } catch (error) {
    console.error("Error listando veterinarios:", error);
    res.status(500).json({ message: "Error al listar veterinarios" });
  }
};

exports.eliminarVeterinario = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await veterinarioService.eliminarLogico(id);

    res.json({
      message: "Veterinario eliminado lógicamente",
      data: actualizado,
    });
  } catch (error) {
    console.error("Error al eliminar veterinario:", error);

    if (error.code === "VETERINARIO_NO_ENCONTRADO") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al eliminar veterinario" });
  }
};
