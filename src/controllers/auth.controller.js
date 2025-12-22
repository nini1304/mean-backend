// src/controllers/auth.controller.js
const authService = require("../services/auth.service");

exports.login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        message: "Los campos 'correo' y 'contrasena' son obligatorios",
      });
    }

    const resultado = await authService.login(correo, contrasena);

    res.json({
      message: "Login exitoso",
      token: resultado.token,
      usuario: resultado.usuario,
    });
  } catch (error) {
    console.error("Error en login:", error);

    if (error.code === "CREDENCIALES_INVALIDAS") {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    res.status(500).json({ message: "Error al realizar login" });
  }
};

exports.solicitarResetContrasena = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res
        .status(400)
        .json({ message: "El campo 'correo' es obligatorio" });
    }

    await authService.solicitarResetContrasena(correo);

    // Siempre respondemos lo mismo, exista o no el usuario
    res.json({
      message:
        "Si el correo existe en el sistema, se ha enviado una contraseña temporal.",
    });
  } catch (error) {
    console.error("Error al solicitar reset de contraseña:", error);
    res
      .status(500)
      .json({ message: "Error al procesar la solicitud de restablecimiento" });
  }
};
