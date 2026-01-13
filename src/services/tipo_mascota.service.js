const TipoMascota = require("../models/tipo_mascota.model");

class TipoMascotaService {
  async crearTipoMascota(data) {
    const { tipo_mascota } = data;

    const nuevo = await TipoMascota.create({
      tipo_mascota,
    });

    return nuevo;
  }

  async listarTiposMascota() {
    return await TipoMascota.find().sort({ tipo_mascota: 1 }).lean();
  }

  async obtenerPorId(id) {
    return await TipoMascota.findById(id).lean();
  }
}

module.exports = new TipoMascotaService();
