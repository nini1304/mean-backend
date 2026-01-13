const mongoose = require("mongoose");

const mascotaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    tipo_mascota: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TipoMascota",
      required: true,
    },

    edad: {
      type: Number,
      min: 0,
      required: true,
    },

    peso: {
      type: Number,
      min: 0,
      required: true,
    },

   
    sexo: {
      type: String,
      required: true,
      trim: true,
    },

    raza: {
      type: String,
      required: true,
      trim: true,
    },

    eliminado: {
      type: Boolean,
      default: false, // borrado lógico
    },
  },
  {
    timestamps: true,
    collection: "mascotas",
  }
);

// Para listar rápido solo no eliminadas
mascotaSchema.index({ eliminado: 1 });

module.exports = mongoose.model("Mascota", mascotaSchema);
