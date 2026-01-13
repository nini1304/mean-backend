const mongoose = require("mongoose");

const tipoMascotaSchema = new mongoose.Schema(
  {
    tipo_mascota: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // opcional: para estandarizar (PERRO, GATO, etc.)
      unique: true,    // evita duplicados
    },
  },
  {
    timestamps: true,
    collection: "tipo_mascota",
  }
);

module.exports = mongoose.model("TipoMascota", tipoMascotaSchema);
