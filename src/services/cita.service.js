const Cita = require("../models/cita.model");
const Veterinario = require("../models/veterinario.model");
const Mascota = require("../models/mascota.model");
const HorarioVeterinario = require("../models/horario_veterinario.model");
const UsuarioMascota = require("../models/usuario_mascota.model");
const { DateTime } = require("luxon");


function toDateOrThrow(v, fieldName) {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
        const err = new Error(`Fecha inválida en '${fieldName}'`);
        err.code = "VALIDACION";
        throw err;
    }
    return d;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
    // Se solapan si empiezan antes de que termine el otro y terminan después de que empiece el otro
    return aStart < bEnd && aEnd > bStart;
}

// "08:00" => minutos
function hhmmToMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

class CitaService {


    async listarPorRango({ start, end, id_veterinario }) {
        const startDate = toDateOrThrow(start, "start");
        const endDate = toDateOrThrow(end, "end");

        const filtro = {
            eliminado: false,
            // citas que caen en el rango (intersección)
            start: { $lt: endDate },
            end: { $gt: startDate },
        };

        if (id_veterinario) filtro.id_veterinario = id_veterinario;

        const citas = await Cita.find(filtro)
            .populate({
                path: "id_mascota",
                select: "nombre raza sexo edad peso tipo_mascota eliminado",
                populate: { path: "tipo_mascota", select: "tipo_mascota" },
            })
            .populate({
                path: "id_veterinario",
                select: "especialidad id_usuario eliminado",
                populate: { path: "id_usuario", select: "nombre_completo correo numero_celular eliminado" },
            })
            .lean();

        // Si no guardaste id_usuario, lo resolvemos desde UsuarioMascota (activo)
        // (esto evita duplicar data)
        const conDueno = await Promise.all(
            citas.map(async (c) => {
                let dueno = null;

                if (c.id_usuario) {
                    // si ya tienes id_usuario, podrías poblarlo en vez de esto
                    dueno = { id: c.id_usuario };
                } else if (c.id_mascota?._id) {
                    const rel = await UsuarioMascota.findOne({ id_mascota: c.id_mascota._id, activo: true })
                        .populate("id_usuario", "nombre_completo correo numero_celular eliminado")
                        .lean();

                    if (rel?.id_usuario && !rel.id_usuario.eliminado) {
                        dueno = {
                            id: rel.id_usuario._id,
                            nombre_completo: rel.id_usuario.nombre_completo,
                            correo: rel.id_usuario.correo,
                            numero_celular: rel.id_usuario.numero_celular,
                        };
                    }
                }

                // Formato FullCalendar-friendly
                const mascotaNombre = c.id_mascota?.nombre || "Mascota";
                const vetNombre = c.id_veterinario?.id_usuario?.nombre_completo || "Veterinario";
                const title = c.titulo?.trim()
                    ? c.titulo
                    : `${mascotaNombre} - ${vetNombre} (${c.estado})`;

                return {
                    ...c,
                    dueno,
                    // opcional: para FullCalendar
                    fc: {
                        id: c._id,
                        title,
                        start: c.start,
                        end: c.end,
                    },
                };
            })
        );

        return conDueno;
    }

    async crearCita(payload) {
        const { id_veterinario, id_mascota, start, end, tipo = "CITA" } = payload;

        if (!id_veterinario || !id_mascota || !start || !end) {
            const err = new Error("Campos obligatorios: id_veterinario, id_mascota, start, end");
            err.code = "VALIDACION";
            throw err;
        }

        const startDate = toDateOrThrow(start, "start");
        const endDate = toDateOrThrow(end, "end");
        if (endDate <= startDate) {
            const err = new Error("end debe ser mayor que start");
            err.code = "VALIDACION";
            throw err;
        }

        const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false }).lean();
        if (!vet) {
            const err = new Error("Veterinario no encontrado o eliminado");
            err.code = "VET_NO_ENCONTRADO";
            throw err;
        }

        const mascota = await Mascota.findOne({ _id: id_mascota, eliminado: false }).lean();
        if (!mascota) {
            const err = new Error("Mascota no encontrada o eliminada");
            err.code = "MASCOTA_NO_ENCONTRADA";
            throw err;
        }

        // 1) Validar que cae en el horario del veterinario (solo para CITA; CIRUGIA puede ser libre)
        if (tipo === "CONSULTA") {
            const CLINIC_TZ = process.env.CLINIC_TZ || "America/La_Paz";

            // interpretar ISO respetando el offset que envías (-04:00) y convertirlo a la TZ de la clínica
            const startDT = DateTime.fromISO(start, { setZone: true }).setZone(CLINIC_TZ);
            const endDT = DateTime.fromISO(end, { setZone: true }).setZone(CLINIC_TZ);

            // Luxon: weekday 1=Mon ... 7=Sun
            // Tu modelo: 0=Dom ... 6=Sáb
            const dia = startDT.weekday % 7;

            const horario = await HorarioVeterinario.findOne({
                id_veterinario,
                dia_semana: dia,
                eliminado: false,
                activo: true,
            }).lean();

            if (!horario) {
                const err = new Error("El veterinario no atiende ese día (sin horario activo)");
                err.code = "FUERA_DE_HORARIO";
                throw err;
            }

            const ini = hhmmToMinutes(horario.hora_inicio);
            const fin = hhmmToMinutes(horario.hora_fin);

            const startMin = startDT.hour * 60 + startDT.minute;
            const endMin = endDT.hour * 60 + endDT.minute;

            if (startMin < ini || endMin > fin) {
                const err = new Error("La cita está fuera del horario del veterinario");
                err.code = "FUERA_DE_HORARIO";
                throw err;
            }

        }

        // 2) Evitar solapes con otras citas activas (no canceladas) del veterinario
        const existentes = await Cita.find({
            id_veterinario,
            eliminado: false,
            estado: { $ne: "CANCELADA" },
            start: { $lt: endDate },
            end: { $gt: startDate },
        })
            .select("start end")
            .lean();

        if (existentes.length > 0) {
            const err = new Error("El veterinario ya tiene una cita en ese rango");
            err.code = "SOLAPAMIENTO";
            throw err;
        }

        // 3) Obtener dueño (opcional) desde UsuarioMascota
        const rel = await UsuarioMascota.findOne({ id_mascota, activo: true }).lean();
        const id_usuario = rel?.id_usuario || null;

        const doc = await Cita.create({
            id_veterinario,
            id_mascota,
            id_usuario,
            tipo,
            start: startDate,
            end: endDate,
            titulo: payload.titulo || "",
            motivo: payload.motivo || "",
            observaciones: payload.observaciones || "",
            estado: payload.estado || "PENDIENTE",
            eliminado: false,
        });

        return await Cita.findById(doc._id)
            .populate({ path: "id_mascota", populate: { path: "tipo_mascota", select: "tipo_mascota" } })
            .populate({
                path: "id_veterinario",
                select: "especialidad id_usuario",
                populate: { path: "id_usuario", select: "nombre_completo" },
            })
            .lean();
    }

    async actualizarCita(id_cita, payload) {
        const cita = await Cita.findOne({ _id: id_cita, eliminado: false }).lean();
        if (!cita) {
            const err = new Error("Cita no encontrada");
            err.code = "NO_ENCONTRADO";
            throw err;
        }

        // permitimos mover start/end y editar campos
        const update = { ...payload };

        if (update.start) update.start = toDateOrThrow(update.start, "start");
        if (update.end) update.end = toDateOrThrow(update.end, "end");

        if (update.start && update.end && update.end <= update.start) {
            const err = new Error("end debe ser mayor que start");
            err.code = "VALIDACION";
            throw err;
        }

        // si cambian start/end, validamos solapes
        const newStart = update.start || new Date(cita.start);
        const newEnd = update.end || new Date(cita.end);

        const solape = await Cita.findOne({
            _id: { $ne: id_cita },
            id_veterinario: cita.id_veterinario,
            eliminado: false,
            estado: { $ne: "CANCELADA" },
            start: { $lt: newEnd },
            end: { $gt: newStart },
        })
            .select("_id")
            .lean();

        if (solape) {
            const err = new Error("El veterinario ya tiene otra cita en ese rango");
            err.code = "SOLAPAMIENTO";
            throw err;
        }

        const actualizado = await Cita.findOneAndUpdate(
            { _id: id_cita, eliminado: false },
            { $set: update },
            { new: true }
        ).lean();

        return actualizado;
    }

    async cancelarCita(id_cita, motivoCancelacion = "") {
        const actualizado = await Cita.findOneAndUpdate(
            { _id: id_cita, eliminado: false },
            {
                $set: {
                    estado: "CANCELADA",
                    observaciones: motivoCancelacion ? `${motivoCancelacion}` : "",
                },
            },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Cita no encontrada");
            err.code = "NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    async borrarLogico(id_cita) {
        const actualizado = await Cita.findOneAndUpdate(
            { _id: id_cita, eliminado: false },
            { $set: { eliminado: true } },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Cita no encontrada");
            err.code = "NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }
}

module.exports = new CitaService();
