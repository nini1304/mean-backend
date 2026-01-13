const mongoose = require("mongoose");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Mascota = require("../models/mascota.model");
const UsuarioMascota = require("../models/usuario_mascota.model");
const contrasenaService = require("./contrasena.service"); // si crearás contraseña inicial

class PacienteService {
  
  async registrarDuenoConMascotas(payload) {
    const session = await mongoose.startSession();

    try {
      let resultadoFinal = null;

      await session.withTransaction(async () => {
        const { dueno, mascotas } = payload;

        // 1) Buscar rol DUENO (o CLIENTE, según tu BD)
        const rolDueno = await Role.findOne({ nombre: "DUENO" })
          .session(session)
          .lean();

        if (!rolDueno) {
          const error = new Error("No existe el rol DUENO en la base de datos");
          error.code = "ROL_DUENO_NO_EXISTE";
          throw error;
        }

        // 2) Crear dueño (User)
        const nuevoDueno = await User.create(
          [
            {
              nombre_completo: dueno.nombre_completo,
              correo: dueno.correo,
              numero_celular: dueno.numero_celular,
              id_rol: rolDueno._id,
            },
          ],
          { session }
        );

        const duenoCreado = nuevoDueno[0];

        const mascotasDocs = await Mascota.insertMany(
          mascotas.map((m) => ({
            nombre: m.nombre,
            tipo_mascota: m.tipo_mascota,
            edad: m.edad,
            peso: m.peso,
            sexo: m.sexo,
            raza: m.raza,
            eliminado: false,
          })),
          { session }
        );

        // 4) Crear relaciones usuario_mascota
        const relaciones = mascotasDocs.map((mascota) => ({
          id_usuario: duenoCreado._id,
          id_mascota: mascota._id,
          activo: true,
        }));

        await UsuarioMascota.insertMany(relaciones, { session });

        // 5) Armar respuesta (con populate opcional después)
        resultadoFinal = {
          dueno: {
            id: duenoCreado._id,
            nombre_completo: duenoCreado.nombre_completo,
            correo: duenoCreado.correo,
            numero_celular: duenoCreado.numero_celular,
          },
          mascotas: mascotasDocs.map((m) => ({
            id: m._id,
            nombre: m.nombre,
            edad: m.edad,
            peso: m.peso,
            sexo: m.sexo,
            raza: m.raza,
            tipo_mascota: m.tipo_mascota,
          })),
        };
      });

      return resultadoFinal;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new PacienteService();
