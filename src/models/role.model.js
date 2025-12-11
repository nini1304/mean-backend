// src/models/role.model.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,   
      trim: true,
      uppercase: true 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema);
