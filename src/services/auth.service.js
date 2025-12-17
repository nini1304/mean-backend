// src/services/auth.service.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const contrasenaService = require("./contrasena.service");

class AuthService {
  async login(correo, contrasena_plana) {
    // 1) Buscar usuario por correo
    const user = await User.findOne({ correo })
      .populate("id_rol", "nombre") // trae solo el nombre del rol
      .lean();

    if (!user) {
      const error = new Error("Credenciales inválidas");
      error.code = "CREDENCIALES_INVALIDAS";
      throw error;
    }

    // 2) Validar contraseña contra la activa
    const esValida = await contrasenaService.validarContrasena(
      user._id,
      contrasena_plana
    );

    if (!esValida) {
      const error = new Error("Credenciales inválidas");
      error.code = "CREDENCIALES_INVALIDAS";
      throw error;
    }

    // 3) Generar JWT
    const payload = {
      sub: user._id.toString(),
      nombre_completo: user.nombre_completo,       
      correo: user.correo,
      rol: {
        id: user.id_rol?._id?.toString(),
        nombre: user.id_rol?.nombre,  // p.ej. "ADMIN"
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    // 4) Devolver token + algunos datos del usuario
    return {
      token
    };
  }
}

module.exports = new AuthService();
