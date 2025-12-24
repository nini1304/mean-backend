// src/services/auth.service.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const contrasenaService = require("./contrasena.service");
const { generarContrasenaSegura } = require("../utils/password.util");
const { enviarCorreo } = require("../config/mailer");

class AuthService {
  // LOGIN: correo + contraseña
  async login(correo, contrasena_plana) {
    const user = await User.findOne({ correo })
      .populate("id_rol", "nombre")
      .lean();

    if (!user) {
      const error = new Error("Credenciales inválidas");
      error.code = "CREDENCIALES_INVALIDAS";
      throw error;
    }

    // Ojo: aquí usamos la NUEVA firma de validarContrasena
    const { esValida, registro } =
      await contrasenaService.validarContrasena(user._id, contrasena_plana);

    if (!esValida) {
      const error = new Error("Credenciales inválidas");
      error.code = "CREDENCIALES_INVALIDAS";
      throw error;
    }

    const requiereCambioContrasena = registro.motivo === "RESET";

    const payload = {
      sub: user._id.toString(),
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      rol: {
        id: user.id_rol?._id?.toString(),
        nombre: user.id_rol?.nombre,
      },
      requiereCambioContrasena,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    return {
      token,
      requiereCambioContrasena,
    };
  }

  // OLVIDÉ MI CONTRASEÑA: generar contraseña temporal y enviarla por correo
  async solicitarResetContrasena(correo) {
    const user = await User.findOne({ correo }).lean();

    // Por seguridad, no revelamos si existe o no
    if (!user) {
      return;
    }

    // 1) Generar contraseña temporal segura
    const nuevaContrasena = generarContrasenaSegura(12);

    // 2) Guardarla como activa con motivo RESET
    await contrasenaService.guardarContrasena(
      user._id,
      nuevaContrasena,
      "RESET"
    );

    // 3) Enviar correo al usuario
    const subject = "Restablecimiento de contraseña";
    const text = `
Hola ${user.nombre_completo},

Se ha generado una contraseña temporal para tu cuenta.

Tu contraseña temporal es: ${nuevaContrasena}

Por favor, inicia sesión con esta contraseña y cámbiala inmediatamente desde la opción "Cambiar contraseña".

Si tú no solicitaste este cambio, contacta con soporte.
`.trim();

    const html = `
      <p>Hola <b>${user.nombre_completo}</b>,</p>
      <p>Se ha generado una <b>contraseña temporal</b> para tu cuenta.</p>
      <p>Tu contraseña temporal es: <br/>
      <code style="font-size:16px;">${nuevaContrasena}</code></p>
      <p>Por favor, inicia sesión con esta contraseña y cámbiala inmediatamente desde la opción
      <b>"Cambiar contraseña"</b>.</p>
      <p>Si tú no solicitaste este cambio, por favor contacta con soporte.</p>
    `;

    await enviarCorreo({
      to: user.correo,
      subject,
      text,
      html,
    });
  }
}

module.exports = new AuthService();
