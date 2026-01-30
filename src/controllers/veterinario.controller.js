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



exports.crearVeterinarioCompleto = async (req, res) => {
  try {
    const data = await veterinarioService.crearVeterinarioCompleto(req.body);
    res.status(201).json({ message: "Veterinario creado (completo)", data });
  } catch (error) {
    console.error("Error creando veterinario completo:", error);

    const map = {
      VALIDACION: 400,
      ROL_VET_NO_EXISTE: 400,
      CORREO_DUPLICADO: 409,
      DUPLICADO: 409,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });
    res.status(500).json({ message: "Error al crear veterinario (completo)" });
  }
};

exports.listarVeterinariosConHorarios = async (req, res) => {
  try {
    // query opcional: ?soloActivos=true|false
    const soloActivos = req.query.soloActivos !== "false";

    const data = await veterinarioService.listarVeterinariosConHorarios({ soloActivos });
    res.json(data);
  } catch (error) {
    console.error("Error listando veterinarios con horarios:", error);
    res.status(500).json({ message: "Error al listar veterinarios con horarios" });
  }
};

exports.actualizarVeterinarioCompleto = async (req, res) => {
  try {
    const { id } = req.params; // id_veterinario
    const data = await veterinarioService.actualizarVeterinarioCompleto(id, req.body);
    res.json({ message: "Veterinario actualizado", data });
  } catch (error) {
    console.error("Error actualizando veterinario:", error);

    const map = {
      VALIDACION: 400,
      VETERINARIO_NO_ENCONTRADO: 404,
      USUARIO_NO_ENCONTRADO: 404,
      CORREO_DUPLICADO: 409,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });
    res.status(500).json({ message: "Error al actualizar veterinario" });
  }
};

exports.eliminarLogico = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await veterinarioService.eliminarLogico(id);
    return res.json({ ok: true, veterinario: result });
  } catch (err) {
    if (err.code === "VET_CON_CITAS_PENDIENTES") {
      return res.status(409).json({ message: err.message, code: err.code });
    }
    if (err.code === "VETERINARIO_NO_ENCONTRADO") {
      return res.status(404).json({ message: err.message, code: err.code });
    }
    return res.status(500).json({ message: err.message || "Error eliminando veterinario" });
  }
};

