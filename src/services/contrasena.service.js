const bcrypt = require("bcryptjs");
const Contrasena = require("../models/contrasena.model");

class ContrasenaService {
  async guardarContrasena(id_usuario, contrasena_plana, motivo = "CREACION") {
    const saltRounds = 10;
    const hash = await bcrypt.hash(contrasena_plana, saltRounds);

    // 1) Desactivar contraseñas activas anteriores
    await Contrasena.updateMany(
      { id_usuario, activa: true },
      { $set: { activa: false } }
    );

    // 2) Crear nueva contraseña activa
    const registro = await Contrasena.create({
      id_usuario,
      contrasena: hash,
      activa: true,
      motivo,
    });

    return registro;
  }

  // Validar contraseña actual y devolver también el registro (para saber el motivo)
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

}

module.exports = new ContrasenaService();
