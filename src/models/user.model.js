const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nombre_completo: {
      type: String,
      required: true,
      trim: true,
    },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    numero_celular: {
      type: String,
      required: true,
      trim: true,
    },
    id_rol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",      // Nombre del modelo Role
      required: true,
    },
    eliminado: {
      type: Boolean,
      default: false, // borrado lógico del usuario
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
