const bcrypt = require("bcryptjs");
const Contrasena = require("../models/contrasena.model");

class ContrasenaService {
  // Crear o actualizar la contraseña de un usuario
  async guardarContrasena(id_usuario, contrasena_plana) {
    // Generar hash
    const saltRounds = 10;
    const hash = await bcrypt.hash(contrasena_plana, saltRounds);

    // upsert: si ya existe registro para ese usuario, lo actualiza
    const registro = await Contrasena.findOneAndUpdate(
      { id_usuario },
      { contrasena: hash },
      { new: true, upsert: true }
    );

    return registro;
  }

   async validarContrasena(id_usuario, contrasena_plana) {
    const registro = await Contrasena.findOne({
      id_usuario,
      activa: true,
    });

    if (!registro) {
      return false;
    }

    const esValida = await bcrypt.compare(
      contrasena_plana,
      registro.contrasena
    );

    return esValida;
  }

}

module.exports = new ContrasenaService();
