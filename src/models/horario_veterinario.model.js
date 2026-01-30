const mongoose = require("mongoose");

const horarioSchema = new mongoose.Schema(
  {
    id_veterinario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinario",
      required: true,
      index: true,
    },
    dia_semana: { type: Number, min: 0, max: 6, required: true }, // 0=Dom..6=Sáb
    hora_inicio: { type: String, required: true }, // "08:00"
    hora_fin: { type: String, required: true }, // "12:00"
    activo: { type: Boolean, default: true },
    eliminado: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "horarios_veterinario" }
);

horarioSchema.index(
  { id_veterinario: 1, dia_semana: 1, hora_inicio: 1, hora_fin: 1 },
  { unique: true, partialFilterExpression: { eliminado: false } }
);

// índice para ordenar/buscar
horarioSchema.index({ id_veterinario: 1, dia_semana: 1, hora_inicio: 1 });

module.exports = mongoose.model("HorarioVeterinario", horarioSchema);
