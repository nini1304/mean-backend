const Mascota = require("../models/mascota.model");

class MascotaService {
  async crearMascota(data) {
    const { nombre, tipo_mascota, edad, peso, sexo, raza } = data;

    const mascota = await Mascota.create({
      nombre,
      tipo_mascota, // ObjectId (ref)
      edad,
      peso,
      sexo,
      raza,
      eliminado: false,
    });

    // Devolvemos con populate para que ya venga el tipo
    return await Mascota.findById(mascota._id)
      .populate("tipo_mascota", "tipo_mascota")
      .lean();
  }

  async listarMascotas() {
    return await Mascota.find({ eliminado: false })
      .populate("tipo_mascota", "tipo_mascota")
      .sort({ createdAt: -1 })
      .lean();
  }

  async obtenerPorId(id) {
    return await Mascota.findOne({ _id: id, eliminado: false })
      .populate("tipo_mascota", "tipo_mascota")
      .lean();
  }

  async actualizarMascota(id, data) {
    // No permitimos cambiar eliminado desde aquí (opcional)
    const update = { ...data };
    delete update.eliminado;

    const actualizada = await Mascota.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true }
    )
      .populate("tipo_mascota", "tipo_mascota")
      .lean();

    return actualizada;
  }

  async borrarLogico(id) {
    const actualizada = await Mascota.findByIdAndUpdate(
      id,
      { eliminado: true },
      { new: true }
    ).lean();

    return actualizada;
  }
}

module.exports = new MascotaService();
