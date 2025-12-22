const contrasenaService = require("../services/contrasena.service");

// Guardar / cambiar contraseña (con historial)
exports.guardarContrasena = async (req, res) => {
  try {
    const { id_usuario, contrasena, motivo } = req.body;

    if (!id_usuario || !contrasena) {
      return res.status(400).json({
        message: "Los campos 'id_usuario' y 'contrasena' son obligatorios",
      });
    }

    const registro = await contrasenaService.guardarContrasena(
      id_usuario,
      contrasena,
      motivo || "CREACION" // opcional, por si luego mandas "CAMBIO" o "RESET"
    );

    // No devolvemos la contraseña (ni el hash) por seguridad
    res.status(201).json({
      message: "Contraseña guardada/actualizada correctamente",
      id_usuario: registro.id_usuario,
      id_contrasena: registro._id,
      motivo: registro.motivo,
    });
  } catch (error) {
    console.error("Error al guardar contraseña:", error);
    res.status(500).json({ message: "Error al guardar contraseña" });
  }
};

// Validar contraseña (ej: pruebas o casos especiales, el login real ya lo haces en AuthService)
exports.validarContrasena = async (req, res) => {
  try {
    const { id_usuario, contrasena } = req.body;

    if (!id_usuario || !contrasena) {
      return res.status(400).json({
        message: "Los campos 'id_usuario' y 'contrasena' son obligatorios",
      });
    }

    const { esValida, registro } = await contrasenaService.validarContrasena(
      id_usuario,
      contrasena
    );

    if (!esValida) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    res.json({
      message: "Contraseña correcta",
      motivo: registro.motivo, // ej: CREACION / CAMBIO / RESET
    });
  } catch (error) {
    console.error("Error al validar contraseña:", error);
    res.status(500).json({ message: "Error al validar contraseña" });
  }
};
