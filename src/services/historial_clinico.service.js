// src/services/historial_clinico.service.js
const crypto = require("crypto");
const HistorialClinico = require("../models/historial_clinico.model");
const Mascota = require("../models/mascota.model");
const { minioClient, asegurarBucket } = require("../config/minio");

class HistorialClinicoService {
  async crearHistorialSiNoExiste(id_mascota) {
    // valida mascota
    const mascota = await Mascota.findOne({ _id: id_mascota, eliminado: false }).lean();
    if (!mascota) {
      const err = new Error("Mascota no encontrada o eliminada");
      err.code = "MASCOTA_NO_ENCONTRADA";
      throw err;
    }

    // upsert por id_mascota
    const historial = await HistorialClinico.findOneAndUpdate(
      { id_mascota },
      { $setOnInsert: { id_mascota } },
      { new: true, upsert: true }
    ).lean();

    return historial;
  }

  async subirAdjuntoAExamen({ id_mascota, examen, file }) {
    // examen: { tipo, fecha, resultado?, valores?, id_veterinario? }
    if (!file) {
      const err = new Error("Archivo requerido");
      err.code = "ARCHIVO_REQUERIDO";
      throw err;
    }

    const bucket = process.env.MINIO_BUCKET || "historial";
    await asegurarBucket(bucket);

    // asegura historial
    await this.crearHistorialSiNoExiste(id_mascota);

    // generar key único
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const random = crypto.randomBytes(16).toString("hex");
    const objectKey = `mascotas/${id_mascota}/examenes/${Date.now()}_${random}.${ext || "bin"}`;

    // subir a minio
    await minioClient.putObject(
      bucket,
      objectKey,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype }
    );

    const baseUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
    const url = `${baseUrl}/${bucket}/${objectKey}`;

    const adjunto = {
      bucket,
      objectKey,
      url,
      mimeType: file.mimetype,
      nombreOriginal: file.originalname,
      size: file.size,
      uploadedAt: new Date(),
    };

    // Guardar examen + adjunto dentro del historial (push)
    const examenDoc = {
      tipo: examen.tipo,
      fecha: examen.fecha ? new Date(examen.fecha) : new Date(),
      resultado: examen.resultado || "",
      valores: examen.valores || null,
      id_veterinario: examen.id_veterinario || null,
      adjuntos: [adjunto],
    };

    const actualizado = await HistorialClinico.findOneAndUpdate(
      { id_mascota, eliminado: false },
      { $push: { examenes: examenDoc } },
      { new: true }
    ).lean();

    return {
      examen: examenDoc,
      adjunto,
      historial: actualizado,
    };
  }

  async obtenerPorMascota(id_mascota, { crearSiNoExiste = true } = {}) {
  // valida mascota (que exista y no esté eliminada)
  const mascota = await Mascota.findOne({ _id: id_mascota, eliminado: false }).lean();
  if (!mascota) {
    const err = new Error("Mascota no encontrada o eliminada");
    err.code = "MASCOTA_NO_ENCONTRADA";
    throw err;
  }

  // si quieres auto-crear historial vacío
  if (crearSiNoExiste) {
    await this.crearHistorialSiNoExiste(id_mascota);
  }

  const historial = await HistorialClinico.findOne({
    id_mascota,
    eliminado: false,
  })
    .populate("id_mascota") // opcional: trae datos de la mascota
    .populate("consultas.id_veterinario", "especialidad turno id_usuario")
    .populate("vacunas.id_veterinario", "especialidad turno id_usuario")
    .populate("desparasitaciones.id_veterinario", "especialidad turno id_usuario")
    .populate("procedimientos.id_veterinario", "especialidad turno id_usuario")
    .populate("examenes.id_veterinario", "especialidad turno id_usuario")
    .lean();

  return historial; // si crearSiNoExiste=false, podría ser null
}
}



module.exports = new HistorialClinicoService();
