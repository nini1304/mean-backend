const mongoose = require("mongoose");

const veterinarioSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // un usuario solo puede tener un perfil de veterinario
      index: true,
    },
    especialidad: {
      type: String,
      required: true,
      trim: true,
    },
    eliminado: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "veterinarios",
  }
);

module.exports = mongoose.model("Veterinario", veterinarioSchema);
