// src/models/historial_clinico.model.js
const mongoose = require("mongoose");

const adjuntoSchema = new mongoose.Schema(
  {
    bucket: { type: String, required: true },
    objectKey: { type: String, required: true }, // key en MinIO
    url: { type: String, required: true },       // o presigned si manejas
    mimeType: { type: String, default: "" },
    nombreOriginal: { type: String, default: "" },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const consultaSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true, index: true },
    id_veterinario: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinario", required: true },

    motivo_consulta: { type: String, required: true, trim: true },

    peso_en_consulta: { type: Number, min: 0, required: true },
    temperatura: { type: Number, default: null },

    diagnostico: { type: String, default: "", trim: true },
    tratamiento: { type: String, default: "", trim: true },

    observaciones: { type: String, default: "", trim: true },

  },
  { timestamps: true }
);

const vacunaSchema = new mongoose.Schema(
  {
    vacuna: { type: String, required: true, trim: true },
    fecha_aplicacion: { type: Date, required: true, index: true },
    fecha_refuerzo: { type: Date, default: null },
    id_veterinario: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinario", default: null },
    observaciones: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const desparasitacionSchema = new mongoose.Schema(
  {
    producto: { type: String, required: true, trim: true },
    fecha: { type: Date, required: true, index: true },
    dosis: { type: String, required: true, trim: true },
    proxima: { type: Date, default: null },
    id_veterinario: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinario", default: null },
    observaciones: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const procedimientoSchema = new mongoose.Schema(
  {
    tipo_procedimiento: { type: String, required: true, trim: true },
    fecha: { type: Date, required: true, index: true },
    anestesia_riesgo: { type: String, default: "", trim: true },
    notas: { type: String, default: "", trim: true },
    complicaciones: { type: String, default: "", trim: true },
    id_veterinario: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinario", default: null },
    
  },
  { timestamps: true }
);

const examenSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, trim: true }, // hemograma, rx, eco...
    fecha: { type: Date, required: true, index: true },
    resultado: { type: String, default: "", trim: true }, // texto o resumen
    valores: { type: Object, default: null }, // opcional: valores estructurados
    adjuntos: { type: [adjuntoSchema], default: [] },
    id_veterinario: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinario", default: null },
  },
  { timestamps: true }
);

const historialSchema = new mongoose.Schema(
  {
    id_mascota: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mascota",
      required: true,
      unique: true,
      index: true,
    },

    consultas: { type: [consultaSchema], default: [] },
    vacunas: { type: [vacunaSchema], default: [] },
    desparasitaciones: { type: [desparasitacionSchema], default: [] },
    procedimientos: { type: [procedimientoSchema], default: [] },
    examenes: { type: [examenSchema], default: [] },

    eliminado: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "historial_clinico" }
);

module.exports = mongoose.model("HistorialClinico", historialSchema);
