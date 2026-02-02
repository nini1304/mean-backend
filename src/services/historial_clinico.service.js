// src/services/historial_clinico.service.js
const crypto = require("crypto");
const HistorialClinico = require("../models/historial_clinico.model");
const Mascota = require("../models/mascota.model");
const { minioClient, asegurarBucket } = require("../config/minio");
const UsuarioMascota = require("../models/usuario_mascota.model");


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

    async agregarConsulta(id_mascota, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        // validaciones mínimas (además de las del schema)
        if (!data?.motivo_consulta || !data?.peso_en_consulta || !data?.id_veterinario) {
            const err = new Error("Faltan campos obligatorios: motivo_consulta, peso_en_consulta, id_veterinario");
            err.code = "VALIDACION";
            throw err;
        }

        const consultaDoc = {
            fecha: data.fecha ? new Date(data.fecha) : new Date(),
            id_veterinario: data.id_veterinario,
            motivo_consulta: data.motivo_consulta,
            peso_en_consulta: Number(data.peso_en_consulta),
            temperatura: data.temperatura ?? null,
            diagnostico: data.diagnostico || "",
            tratamiento: data.tratamiento || "",
            observaciones: data.observaciones || "",
        };

        const historial = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false },
            { $push: { consultas: consultaDoc } },
            { new: true }
        ).lean();

        return historial;
    }

    async agregarVacuna(id_mascota, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        if (!data?.vacuna || !data?.fecha_aplicacion) {
            const err = new Error("Faltan campos obligatorios: vacuna, fecha_aplicacion");
            err.code = "VALIDACION";
            throw err;
        }

        const vacunaDoc = {
            vacuna: data.vacuna,
            fecha_aplicacion: new Date(data.fecha_aplicacion),
            fecha_refuerzo: data.fecha_refuerzo ? new Date(data.fecha_refuerzo) : null,
            id_veterinario: data.id_veterinario || null,
            observaciones: data.observaciones || "",
        };

        return await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false },
            { $push: { vacunas: vacunaDoc } },
            { new: true }
        ).lean();
    }

    async agregarDesparasitacion(id_mascota, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        if (!data?.producto || !data?.fecha || !data?.dosis) {
            const err = new Error("Faltan campos obligatorios: producto, fecha, dosis");
            err.code = "VALIDACION";
            throw err;
        }

        const desparasitacionDoc = {
            producto: data.producto,
            fecha: new Date(data.fecha),
            dosis: data.dosis,
            proxima: data.proxima ? new Date(data.proxima) : null,
            id_veterinario: data.id_veterinario || null,
            observaciones: data.observaciones || "",
        };

        return await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false },
            { $push: { desparasitaciones: desparasitacionDoc } },
            { new: true }
        ).lean();
    }

    async agregarProcedimiento(id_mascota, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        if (!data?.tipo_procedimiento || !data?.fecha) {
            const err = new Error("Faltan campos obligatorios: tipo_procedimiento, fecha");
            err.code = "VALIDACION";
            throw err;
        }

        const procedimientoDoc = {
            tipo_procedimiento: data.tipo_procedimiento,
            fecha: new Date(data.fecha),
            anestesia_riesgo: data.anestesia_riesgo || "",
            notas: data.notas || "",
            complicaciones: data.complicaciones || "",
            id_veterinario: data.id_veterinario || null,
        };

        return await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false },
            { $push: { procedimientos: procedimientoDoc } },
            { new: true }
        ).lean();
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

        // const baseUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
        const baseUrl = (process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
        if (!baseUrl) throw new Error("MINIO_PUBLIC_URL no está definido");
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
            .populate({
                path: "id_mascota",
                populate: { path: "tipo_mascota", select: "tipo_mascota" },
            })

            .populate("consultas.id_veterinario", "especialidad turno id_usuario")
            .populate("vacunas.id_veterinario", "especialidad turno id_usuario")
            .populate("desparasitaciones.id_veterinario", "especialidad turno id_usuario")
            .populate("procedimientos.id_veterinario", "especialidad turno id_usuario")
            .populate("examenes.id_veterinario", "especialidad turno id_usuario")
            .lean();

        // si crearSiNoExiste=false podría venir null
        if (!historial) return null;

        // 2) Traer dueño (relación activa) + datos del usuario
        const relacion = await UsuarioMascota.findOne({
            id_mascota,
            activo: true,
        })
            .populate("id_usuario", "nombre_completo correo numero_celular eliminado")
            .lean();

        const dueno = relacion?.id_usuario
            ? {
                id: relacion.id_usuario._id,
                nombre_completo: relacion.id_usuario.nombre_completo,
                correo: relacion.id_usuario.correo,
                numero_celular: relacion.id_usuario.numero_celular,
            }
            : null;

        // 3) Adjuntar al response
        return {
            ...historial,
            dueno, // 👈 aquí ya te llega el propietario
        };
    }


    // helpers
    _buildSet(prefix, data, allowed = []) {
        const set = {};
        for (const key of allowed) {
            if (data[key] !== undefined) set[`${prefix}.${key}`] = data[key];
        }
        return set;
    }

    _parseDateIfProvided(value) {
        if (value === undefined) return undefined;
        const d = new Date(value);
        if (isNaN(d.getTime())) return undefined; // o lanza error si quieres estricto
        return d;
    }

    // ==========================
    // UPDATE CONSULTA
    // ==========================
    async actualizarConsulta(id_mascota, id_consulta, data) {
        // opcional: asegurar historial existe
        await this.crearHistorialSiNoExiste(id_mascota);

        const allowed = [
            "motivo_consulta",
            "diagnostico",
            "tratamiento",
            "observaciones",
            "id_veterinario",
            "temperatura",
        ];

        // fecha y peso_en_consulta requieren parse
        const fecha = this._parseDateIfProvided(data.fecha);
        const peso = data.peso_en_consulta !== undefined ? Number(data.peso_en_consulta) : undefined;

        const set = this._buildSet("consultas.$", data, allowed);
        if (fecha !== undefined) set["consultas.$.fecha"] = fecha;
        if (peso !== undefined && !Number.isNaN(peso)) set["consultas.$.peso_en_consulta"] = peso;

        if (Object.keys(set).length === 0) {
            const err = new Error("No hay campos para actualizar");
            err.code = "VALIDACION";
            throw err;
        }

        const actualizado = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false, "consultas._id": id_consulta },
            { $set: set },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Consulta no encontrada");
            err.code = "SUBDOC_NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    // ==========================
    // UPDATE VACUNA
    // ==========================
    async actualizarVacuna(id_mascota, id_vacuna, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        const allowed = ["vacuna", "observaciones", "id_veterinario"];
        const fa = this._parseDateIfProvided(data.fecha_aplicacion);
        const fr = this._parseDateIfProvided(data.fecha_refuerzo);

        const set = this._buildSet("vacunas.$", data, allowed);
        if (fa !== undefined) set["vacunas.$.fecha_aplicacion"] = fa;
        if (data.fecha_refuerzo === null) set["vacunas.$.fecha_refuerzo"] = null;
        else if (fr !== undefined) set["vacunas.$.fecha_refuerzo"] = fr;

        if (Object.keys(set).length === 0) {
            const err = new Error("No hay campos para actualizar");
            err.code = "VALIDACION";
            throw err;
        }

        const actualizado = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false, "vacunas._id": id_vacuna },
            { $set: set },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Vacuna no encontrada");
            err.code = "SUBDOC_NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    // ==========================
    // UPDATE DESPARASITACION
    // ==========================
    async actualizarDesparasitacion(id_mascota, id_item, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        const allowed = ["producto", "dosis", "observaciones", "id_veterinario"];
        const fecha = this._parseDateIfProvided(data.fecha);
        const proxima = this._parseDateIfProvided(data.proxima);

        const set = this._buildSet("desparasitaciones.$", data, allowed);
        if (fecha !== undefined) set["desparasitaciones.$.fecha"] = fecha;
        if (data.proxima === null) set["desparasitaciones.$.proxima"] = null;
        else if (proxima !== undefined) set["desparasitaciones.$.proxima"] = proxima;

        if (Object.keys(set).length === 0) {
            const err = new Error("No hay campos para actualizar");
            err.code = "VALIDACION";
            throw err;
        }

        const actualizado = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false, "desparasitaciones._id": id_item },
            { $set: set },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Desparasitación no encontrada");
            err.code = "SUBDOC_NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    // ==========================
    // UPDATE PROCEDIMIENTO
    // ==========================
    async actualizarProcedimiento(id_mascota, id_proc, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        const allowed = [
            "tipo_procedimiento",
            "anestesia_riesgo",
            "notas",
            "complicaciones",
            "id_veterinario",
        ];
        const fecha = this._parseDateIfProvided(data.fecha);

        const set = this._buildSet("procedimientos.$", data, allowed);
        if (fecha !== undefined) set["procedimientos.$.fecha"] = fecha;

        if (Object.keys(set).length === 0) {
            const err = new Error("No hay campos para actualizar");
            err.code = "VALIDACION";
            throw err;
        }

        const actualizado = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false, "procedimientos._id": id_proc },
            { $set: set },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Procedimiento no encontrado");
            err.code = "SUBDOC_NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    // ==========================
    // UPDATE EXAMEN (SIN ARCHIVOS)
    // ==========================
    async actualizarExamen(id_mascota, id_examen, data) {
        await this.crearHistorialSiNoExiste(id_mascota);

        const allowed = ["tipo", "resultado", "valores", "id_veterinario"];
        const fecha = this._parseDateIfProvided(data.fecha);

        const set = this._buildSet("examenes.$", data, allowed);
        if (fecha !== undefined) set["examenes.$.fecha"] = fecha;

        if (Object.keys(set).length === 0) {
            const err = new Error("No hay campos para actualizar");
            err.code = "VALIDACION";
            throw err;
        }

        const actualizado = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false, "examenes._id": id_examen },
            { $set: set },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Examen no encontrado");
            err.code = "SUBDOC_NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    // ==========================
    // AGREGAR ADJUNTO A EXAMEN EXISTENTE
    // ==========================
    async agregarAdjuntoAExamenExistente({ id_mascota, id_examen, file }) {
        if (!file) {
            const err = new Error("Archivo requerido");
            err.code = "ARCHIVO_REQUERIDO";
            throw err;
        }

        const bucket = process.env.MINIO_BUCKET || "historial";
        await asegurarBucket(bucket);

        // key único
        const ext = (file.originalname.split(".").pop() || "").toLowerCase();
        const random = crypto.randomBytes(16).toString("hex");
        const objectKey = `mascotas/${id_mascota}/examenes/${id_examen}/${Date.now()}_${random}.${ext || "bin"}`;

        await minioClient.putObject(
            bucket,
            objectKey,
            file.buffer,
            file.size,
            { "Content-Type": file.mimetype }
        );

        const baseUrl = (process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
        if (!baseUrl) throw new Error("MINIO_PUBLIC_URL no está definido");
       


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

        const actualizado = await HistorialClinico.findOneAndUpdate(
            { id_mascota, eliminado: false, "examenes._id": id_examen },
            { $push: { "examenes.$.adjuntos": adjunto } },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Examen no encontrado para adjuntar archivo");
            err.code = "SUBDOC_NO_ENCONTRADO";
            throw err;
        }

        return { adjunto, historial: actualizado };
    }
}



module.exports = new HistorialClinicoService();
