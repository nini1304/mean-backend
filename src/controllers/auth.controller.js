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
