const mongoose = require("mongoose");

const usuarioMascotaSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    id_mascota: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mascota",
      required: true,
      index: true,
    },
    activo: {
      type: Boolean,
      default: true, // por si quieres desasociar sin borrar
    },
  },
  {
    timestamps: true,
    collection: "usuario_mascota",
  }
);

// Evita duplicar la misma relación usuario-mascota
usuarioMascotaSchema.index({ id_usuario: 1, id_mascota: 1 }, { unique: true });

module.exports = mongoose.model("UsuarioMascota", usuarioMascotaSchema);
