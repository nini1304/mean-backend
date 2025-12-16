const mongoose = require("mongoose");

const contrasenaSchema = new mongoose.Schema(
  {
    contrasena: {
      type: String,
      required: true, // HASH de la contraseña
    },
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      
    },
    activa: {
      type: Boolean,
      default: true, // solo una debería estar activa por usuario
    },
    motivo: {
      type: String,
      enum: ["CREACION", "CAMBIO", "RESET"],
      default: "CREACION",
    },
  },
  {
    timestamps: true,
    collection: "contrasenas",
  }
);

// Índice útil: todas las contraseñas de un usuario, las más recientes primero
contrasenaSchema.index({ id_usuario: 1, createdAt: -1 });

module.exports = mongoose.model("Contrasena", contrasenaSchema);
