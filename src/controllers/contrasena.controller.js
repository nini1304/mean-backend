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

exports.cambiarContrasena = async (req, res) => {
  try {
    const id_usuario = req.user.sub; // viene del JWT
    const { contrasena_actual, contrasena_nueva } = req.body;

    if (!contrasena_actual || !contrasena_nueva) {
      return res.status(400).json({
        message:
          "Los campos 'contrasena_actual' y 'contrasena_nueva' son obligatorios",
      });
    }

    // 1) Validar que la contraseña actual sea correcta
    const { esValida } = await contrasenaService.validarContrasena(
      id_usuario,
      contrasena_actual
    );

    if (!esValida) {
      return res
        .status(401)
        .json({ message: "La contraseña actual no es correcta" });
    }

    // (Opcional) Validar complejidad de la nueva contraseña
    const esFuerte = validarComplejidadContrasena(contrasena_nueva);
    if (!esFuerte) {
      return res.status(400).json({
        message:
          "La contraseña nueva no cumple con la política de seguridad (longitud mínima, mayúsculas, números y caracteres especiales).",
      });
    }

    // 2) Cambiar contraseña (esta función revisa historial y evita reutilización)
    await contrasenaService.cambiarContrasena(id_usuario, contrasena_nueva);

    res.json({ message: "Contraseña cambiada correctamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);

    if (error.code === "CONTRASENA_REPETIDA") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
};

// helper local en el controller o en un util separado
function validarComplejidadContrasena(contra) {
  // mínimo 12 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 especial
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@$%&*?\-_.]).{12,}$/;
  return regex.test(contra);
}
