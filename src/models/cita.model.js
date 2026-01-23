const mongoose = require("mongoose");

const citaSchema = new mongoose.Schema(
  {
    id_veterinario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinario",
      required: true,
      index: true,
    },
    id_mascota: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mascota",
      required: true,
      index: true,
    },
    // opcional: útil para filtros rápidos (puedes llenarlo desde usuario_mascota)
    id_dueno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true, index: true },

    tipo: {
      type: String,
      enum: ["CONSULTA", "VACUNA", "CONTROL", "CIRUGIA", "OTRO"],
      default: "CONSULTA",
    },
    estado: {
      type: String,
      enum: ["PENDIENTE", "CONFIRMADA", "CANCELADA", "NO_ASISTIO", "COMPLETADA"],
      default: "PENDIENTE",
    },

    notas: { type: String, default: "", trim: true },

    eliminado: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "citas" }
);

// ayuda a consultas
citaSchema.index({ id_veterinario: 1, inicio: 1, fin: 1 });

module.exports = mongoose.model("Cita", citaSchema);
