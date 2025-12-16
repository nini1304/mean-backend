const contrasenaService = require("../services/contrasena.service");

exports.guardarContrasena = async (req, res) => {
  try {
    const { id_usuario, contrasena } = req.body;

    if (!id_usuario || !contrasena) {
      return res.status(400).json({
        message: "Los campos 'id_usuario' y 'contrasena' son obligatorios",
      });
    }

    const registro = await contrasenaService.guardarContrasena(
      id_usuario,
      contrasena
    );

    // No devolvemos la contraseña (ni el hash) por seguridad
    res.status(201).json({
      message: "Contraseña guardada/actualizada correctamente",
      id_usuario: registro.id_usuario,
      id_contrasena: registro._id,
    });
  } catch (error) {
    console.error("Error al guardar contraseña:", error);
    res.status(500).json({ message: "Error al guardar contraseña" });
  }
};

// Ejemplo de endpoint para validar (p.ej. antes de hacer login real)
exports.validarContrasena = async (req, res) => {
  try {
    const { id_usuario, contrasena } = req.body;

    if (!id_usuario || !contrasena) {
      return res.status(400).json({
        message: "Los campos 'id_usuario' y 'contrasena' son obligatorios",
      });
    }

    const esValida = await contrasenaService.validarContrasena(
      id_usuario,
      contrasena
    );

    if (!esValida) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    res.json({ message: "Contraseña correcta" });
  } catch (error) {
    console.error("Error al validar contraseña:", error);
    res.status(500).json({ message: "Error al validar contraseña" });
  }
};
