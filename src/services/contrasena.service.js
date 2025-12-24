// src/services/contrasena.service.js
const bcrypt = require("bcryptjs");
const Contrasena = require("../models/contrasena.model");

class ContrasenaService {
  // cuántas contraseñas anteriores NO puede repetir
  #historialMax = 5;

  async guardarContrasena(id_usuario, contrasena_plana, motivo = "CREACION") {
    const saltRounds = 10;
    const hash = await bcrypt.hash(contrasena_plana, saltRounds);

    await Contrasena.updateMany(
      { id_usuario, activa: true },
      { $set: { activa: false } }
    );

    const registro = await Contrasena.create({
      id_usuario,
      contrasena: hash,
      activa: true,
      motivo,
    });

    return registro;
  }

  async validarContrasena(id_usuario, contrasena_plana) {
    const registro = await Contrasena.findOne({
      id_usuario,
      activa: true,
    });

    if (!registro) {
      return { esValida: false, registro: null };
    }

    const esValida = await bcrypt.compare(
      contrasena_plana,
      registro.contrasena
    );

    return { esValida, registro };
  }

  // 👉 Cambiar contraseña (no permitir reutilizar últimas N)
  async cambiarContrasena(id_usuario, contrasena_plana_nueva) {
    // 1) Obtener las últimas N contraseñas del usuario (activas e inactivas)
    const historial = await Contrasena.find({ id_usuario })
      .sort({ createdAt: -1 })
      .limit(this.#historialMax);

    for (const registro of historial) {
      const yaUsada = await bcrypt.compare(
        contrasena_plana_nueva,
        registro.contrasena
      );

      if (yaUsada) {
        const error = new Error(
          "La nueva contraseña no puede ser igual a una de las últimas contraseñas utilizadas."
        );
        error.code = "CONTRASENA_REPETIDA";
        throw error;
      }
    }

    // 2) Si pasa la validación, guardamos como CAMBIO usando la lógica existente
    const nueva = await this.guardarContrasena(
      id_usuario,
      contrasena_plana_nueva,
      "CAMBIO"
    );

    return nueva;
  }
}

module.exports = new ContrasenaService();
