const Veterinario = require("../models/veterinario.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const contrasenaService = require("./contrasena.service");
const HorarioVeterinario = require("../models/horario_veterinario.model");
const Cita = require("../models/cita.model");


function validarHHMM(s) {
    // valida "08:00"
    return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

function hhmmToMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

class VeterinarioService {

    async crearVeterinarioCompleto(payload) {
        const { usuario, contrasena, especialidad, horarios } = payload || {};

        if (!usuario?.nombre_completo || !usuario?.correo || !usuario?.numero_celular) {
            const err = new Error("Campos obligatorios: usuario.nombre_completo, usuario.correo, usuario.numero_celular");
            err.code = "VALIDACION";
            throw err;
        }
        if (!contrasena) {
            const err = new Error("Campo obligatorio: contrasena");
            err.code = "VALIDACION";
            throw err;
        }
        if (!especialidad) {
            const err = new Error("Campo obligatorio: especialidad");
            err.code = "VALIDACION";
            throw err;
        }

        // horarios puede ser opcional, pero si viene, validar
        if (horarios !== undefined) {
            if (!Array.isArray(horarios)) {
                const err = new Error("horarios debe ser un arreglo");
                err.code = "VALIDACION";
                throw err;
            }

            for (const h of horarios) {
                if (h.dia_semana === undefined || h.hora_inicio === undefined || h.hora_fin === undefined) {
                    const err = new Error("Cada horario requiere: dia_semana, hora_inicio, hora_fin");
                    err.code = "VALIDACION";
                    throw err;
                }
                if (h.dia_semana < 0 || h.dia_semana > 6) {
                    const err = new Error("dia_semana debe estar entre 0 y 6");
                    err.code = "VALIDACION";
                    throw err;
                }
                if (!validarHHMM(h.hora_inicio) || !validarHHMM(h.hora_fin)) {
                    const err = new Error("hora_inicio/hora_fin deben tener formato HH:MM (ej: 08:00)");
                    err.code = "VALIDACION";
                    throw err;
                }
                if (hhmmToMinutes(h.hora_fin) <= hhmmToMinutes(h.hora_inicio)) {
                    const err = new Error("hora_fin debe ser mayor que hora_inicio");
                    err.code = "VALIDACION";
                    throw err;
                }
            }
        }

        // rollback best-effort
        let userCreado = null;
        let vetCreado = null;
        let horariosCreados = [];

        try {
            // 1) rol VETERINARIO
            const rolVet = await Role.findOne({ nombre: "VETERINARIO" }).lean();
            if (!rolVet) {
                const err = new Error("No existe el rol VETERINARIO en la base de datos");
                err.code = "ROL_VET_NO_EXISTE";
                throw err;
            }

            // 2) validar correo duplicado
            const correoNorm = usuario.correo.toLowerCase().trim();
            const dup = await User.findOne({ correo: correoNorm }).lean();
            if (dup) {
                const err = new Error("El correo ya está registrado");
                err.code = "CORREO_DUPLICADO";
                throw err;
            }

            // 3) crear user
            userCreado = await User.create({
                nombre_completo: usuario.nombre_completo.trim(),
                correo: correoNorm,
                numero_celular: usuario.numero_celular.trim(),
                id_rol: rolVet._id,
                eliminado: false,
            });

            // 4) guardar contraseña
            await contrasenaService.guardarContrasena(userCreado._id, contrasena, "CREACION");

            // 5) crear perfil veterinario
            vetCreado = await Veterinario.create({
                id_usuario: userCreado._id,
                especialidad: String(especialidad).trim(),
                eliminado: false,
            });

            // 6) crear horarios (opcional)
            if (Array.isArray(horarios) && horarios.length > 0) {
                // si te preocupa duplicado por dia, insertMany fallará por índice unique
                horariosCreados = await HorarioVeterinario.insertMany(
                    horarios.map((h) => ({
                        id_veterinario: vetCreado._id,
                        dia_semana: h.dia_semana,
                        hora_inicio: h.hora_inicio,
                        hora_fin: h.hora_fin,
                        activo: h.activo !== undefined ? !!h.activo : true,
                        eliminado: false,
                    }))
                );
            }

            // respuesta final
            const vet = await Veterinario.findById(vetCreado._id)
                .populate("id_usuario", "nombre_completo correo numero_celular")
                .lean();

            return {
                veterinario: {
                    id: vet._id,
                    especialidad: vet.especialidad,
                    usuario: vet.id_usuario,
                },
                horarios: horariosCreados.map((h) => ({
                    id: h._id,
                    dia_semana: h.dia_semana,
                    hora_inicio: h.hora_inicio,
                    hora_fin: h.hora_fin,
                    activo: h.activo,
                })),
            };
        } catch (error) {
            // rollback best effort
            try {
                if (horariosCreados.length > 0) {
                    const ids = horariosCreados.map((h) => h._id);
                    await HorarioVeterinario.deleteMany({ _id: { $in: ids } });
                }
                if (vetCreado) {
                    await Veterinario.deleteOne({ _id: vetCreado._id });
                }
                if (userCreado) {
                    const Contrasena = require("../models/contrasena.model");
                    await Contrasena.deleteMany({ id_usuario: userCreado._id });
                    await User.deleteOne({ _id: userCreado._id });
                }
            } catch (rollbackError) {
                console.error("Rollback falló:", rollbackError);
            }

            // mapear error por índice unique de horarios o veterinario
            if (error?.code === 11000) {
                const err = new Error("Duplicado: puede ser correo, veterinario ya existe, o horario repetido por día");
                err.code = "DUPLICADO";
                throw err;
            }

            throw error;
        }
    }

    async eliminarLogico(id_veterinario) {
        // 1) validar veterinario existe y está activo
        const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false }).lean();
        if (!vet) {
            const err = new Error("Veterinario no encontrado");
            err.code = "VETERINARIO_NO_ENCONTRADO";
            throw err;
        }

        // 2) validar que no tenga citas PENDIENTE (no eliminadas)
        const tienePendientes = await Cita.exists({
            id_veterinario,
            eliminado: false,
            estado: "PENDIENTE",
        });

        if (tienePendientes) {
            const err = new Error("No se puede eliminar: el veterinario tiene citas PENDIENTE.");
            err.code = "VET_CON_CITAS_PENDIENTES";
            throw err;
        }

        // 3) borrado lógico veterinario
        const actualizado = await Veterinario.findByIdAndUpdate(
            id_veterinario,
            { $set: { eliminado: true } },
            { new: true }
        ).lean();

        // 4) (recomendado) borrar lógicamente horarios activos del vet
        await HorarioVeterinario.updateMany(
            { id_veterinario, eliminado: false },
            { $set: { eliminado: true, activo: false } }
        );

        return actualizado;
    }



    async crearVeterinario({ id_usuario, especialidad }) {
        // 1) validar usuario existe y no está eliminado
        const user = await User.findOne({ _id: id_usuario, eliminado: false })
            .populate("id_rol", "nombre")
            .lean();

        if (!user) {
            const err = new Error("Usuario no encontrado o eliminado");
            err.code = "USUARIO_NO_ENCONTRADO";
            throw err;
        }

        // 2) (recomendado) validar que el usuario tenga rol VETERINARIO
        // Cambia "VETERINARIO" por el nombre exacto que tengas en tu BD (ej: "VET")
        if (user.id_rol?.nombre !== "VETERINARIO") {
            const err = new Error("El usuario no tiene rol VETERINARIO");
            err.code = "USUARIO_NO_ES_VETERINARIO";
            throw err;
        }

        // 3) crear (o evitar duplicado si ya existe)
        try {
            const creado = await Veterinario.create({
                id_usuario,
                especialidad,
                eliminado: false,
            });

            return await Veterinario.findById(creado._id)
                .populate("id_usuario", "nombre_completo correo numero_celular")
                .lean();
        } catch (error) {
            // perfil ya existe para ese usuario (unique: true)
            if (error.code === 11000) {
                const err = new Error("Este usuario ya tiene un perfil de veterinario");
                err.code = "VETERINARIO_YA_EXISTE";
                throw err;
            }
            throw error;
        }
    }

    async listarVeterinarios() {
        const veterinarios = await Veterinario.find({ eliminado: false })
            .populate({
                path: "id_usuario",
                match: { eliminado: false },
                select: "nombre_completo correo numero_celular",
            })
            .lean();

        // Por seguridad, filtrar si el usuario fue eliminado
        return veterinarios
            .filter((v) => v.id_usuario)
            .map((v) => ({
                id: v._id,
                especialidad: v.especialidad,
                usuario: {
                    id: v.id_usuario._id,
                    nombre_completo: v.id_usuario.nombre_completo,
                    correo: v.id_usuario.correo,
                    numero_celular: v.id_usuario.numero_celular,
                },
                createdAt: v.createdAt,
                updatedAt: v.updatedAt,
            }));
    }


    async obtenerPorId(id_veterinario) {
        const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false })
            .populate("id_usuario", "nombre_completo correo numero_celular")
            .lean();

        if (!vet) {
            const err = new Error("Veterinario no encontrado");
            err.code = "VETERINARIO_NO_ENCONTRADO";
            throw err;
        }

        return vet;
    }

    async eliminarLogico(id_veterinario) {
        const actualizado = await Veterinario.findByIdAndUpdate(
            id_veterinario,
            { eliminado: true },
            { new: true }
        ).lean();

        if (!actualizado) {
            const err = new Error("Veterinario no encontrado");
            err.code = "VETERINARIO_NO_ENCONTRADO";
            throw err;
        }

        return actualizado;
    }

    async listarVeterinariosConHorarios({ soloActivos = true } = {}) {
        // 1) Veterinarios (no eliminados) + usuario
        const veterinarios = await Veterinario.find({ eliminado: false })
            .populate({
                path: "id_usuario",
                match: { eliminado: false },
                select: "nombre_completo correo numero_celular",
            })
            .lean();

        // filtrar si el usuario fue eliminado
        const vetsOk = veterinarios.filter((v) => v.id_usuario);

        if (vetsOk.length === 0) return [];

        const idsVet = vetsOk.map((v) => v._id);

        // 2) Horarios de esos veterinarios
        const filtroHorarios = {
            id_veterinario: { $in: idsVet },
            eliminado: false,
        };
        if (soloActivos) filtroHorarios.activo = true;

        const horarios = await HorarioVeterinario.find(filtroHorarios)
            .sort({ id_veterinario: 1, dia_semana: 1, hora_inicio: 1 })
            .lean();

        // 3) Agrupar horarios por veterinario
        const mapHorarios = new Map(); // key: vetId -> array
        for (const h of horarios) {
            const key = String(h.id_veterinario);
            if (!mapHorarios.has(key)) mapHorarios.set(key, []);
            mapHorarios.get(key).push({
                id: h._id,
                dia_semana: h.dia_semana,
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                activo: h.activo,
            });
        }

        // 4) Respuesta final
        return vetsOk.map((v) => ({
            id: v._id,
            especialidad: v.especialidad,
            usuario: {
                id: v.id_usuario._id,
                nombre_completo: v.id_usuario.nombre_completo,
                correo: v.id_usuario.correo,
                numero_celular: v.id_usuario.numero_celular,
            },
            horarios: mapHorarios.get(String(v._id)) || [],
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
        }));
    }


    async actualizarVeterinarioCompleto(id_veterinario, payload) {
        const { usuario, especialidad, horarios } = payload || {};

        // 1) validar veterinario existe
        const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false }).lean();
        if (!vet) {
            const err = new Error("Veterinario no encontrado o eliminado");
            err.code = "VETERINARIO_NO_ENCONTRADO";
            throw err;
        }

        // 2) cargar user
        const userActual = await User.findOne({ _id: vet.id_usuario, eliminado: false }).lean();
        if (!userActual) {
            const err = new Error("Usuario del veterinario no encontrado o eliminado");
            err.code = "USUARIO_NO_ENCONTRADO";
            throw err;
        }

        // 3) actualizar usuario (si viene)
        const userUpdate = {};
        if (usuario?.nombre_completo !== undefined) userUpdate.nombre_completo = String(usuario.nombre_completo).trim();
        if (usuario?.numero_celular !== undefined) userUpdate.numero_celular = String(usuario.numero_celular).trim();
        if (usuario?.correo !== undefined) userUpdate.correo = String(usuario.correo).toLowerCase().trim();

        // correo duplicado
        if (userUpdate.correo) {
            const dup = await User.findOne({
                _id: { $ne: userActual._id },
                correo: userUpdate.correo,
            }).lean();

            if (dup) {
                const err = new Error("El correo ya está registrado por otro usuario");
                err.code = "CORREO_DUPLICADO";
                throw err;
            }
        }

        if (Object.keys(userUpdate).length > 0) {
            await User.updateOne(
                { _id: userActual._id, eliminado: false },
                { $set: userUpdate }
            );
        }

        // 4) actualizar especialidad (si viene)
        if (especialidad !== undefined) {
            const esp = String(especialidad).trim();
            if (!esp) {
                const err = new Error("especialidad no puede estar vacía");
                err.code = "VALIDACION";
                throw err;
            }

            await Veterinario.updateOne(
                { _id: id_veterinario, eliminado: false },
                { $set: { especialidad: esp } }
            );
        }

        if (horarios !== undefined) {
            if (!Array.isArray(horarios)) {
                const err = new Error("horarios debe ser un arreglo");
                err.code = "VALIDACION";
                throw err;
            }

            // Normalizar payload
            const nuevos = (horarios ?? []).map((h) => ({
                dia_semana: Number(h.dia_semana),
                hora_inicio: String(h.hora_inicio),
                hora_fin: String(h.hora_fin),
                activo: h.activo !== undefined ? !!h.activo : true,
            }));

            // Validaciones + dedupe EXACTO (día+inicio+fin)
            const seen = new Set();
            for (const h of nuevos) {
                if (h.dia_semana < 0 || h.dia_semana > 6) {
                    const err = new Error("dia_semana debe estar entre 0 y 6");
                    err.code = "VALIDACION";
                    throw err;
                }
                if (!validarHHMM(h.hora_inicio) || !validarHHMM(h.hora_fin)) {
                    const err = new Error("hora_inicio/hora_fin deben tener formato HH:MM (ej: 08:00)");
                    err.code = "VALIDACION";
                    throw err;
                }
                if (hhmmToMinutes(h.hora_fin) <= hhmmToMinutes(h.hora_inicio)) {
                    const err = new Error("hora_fin debe ser mayor que hora_inicio");
                    err.code = "VALIDACION";
                    throw err;
                }

                const key = `${h.dia_semana}|${h.hora_inicio}|${h.hora_fin}`;
                if (seen.has(key)) {
                    const err = new Error("No puedes repetir el mismo horario (día+inicio+fin) en el payload");
                    err.code = "VALIDACION";
                    throw err;
                }
                seen.add(key);
            }

            // (Opcional pero recomendado) evitar traslapes en el mismo día
            const porDia = new Map(); // dia -> array horarios
            for (const h of nuevos) {
                const k = h.dia_semana;
                if (!porDia.has(k)) porDia.set(k, []);
                porDia.get(k).push(h);
            }
            for (const [dia, arr] of porDia.entries()) {
                arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
                for (let i = 1; i < arr.length; i++) {
                    const prev = arr[i - 1];
                    const cur = arr[i];
                    if (hhmmToMinutes(cur.hora_inicio) < hhmmToMinutes(prev.hora_fin)) {
                        const err = new Error(`Horarios traslapados en dia_semana=${dia}`);
                        err.code = "VALIDACION";
                        throw err;
                    }
                }
            }

            // Comparar con horarios actuales (para NO reemplazar si no cambió)
            const actuales = await HorarioVeterinario.find({
                id_veterinario,
                eliminado: false,
            })
                .select("dia_semana hora_inicio hora_fin activo")
                .lean();

            const normActuales = (actuales ?? []).map((h) => ({
                dia_semana: Number(h.dia_semana),
                hora_inicio: String(h.hora_inicio),
                hora_fin: String(h.hora_fin),
                activo: h.activo !== undefined ? !!h.activo : true,
            }));

            const sortFn = (a, b) =>
                (a.dia_semana - b.dia_semana) ||
                a.hora_inicio.localeCompare(b.hora_inicio) ||
                a.hora_fin.localeCompare(b.hora_fin) ||
                (Number(a.activo) - Number(b.activo));

            normActuales.sort(sortFn);
            nuevos.sort(sortFn);

            const mismo = JSON.stringify(normActuales) === JSON.stringify(nuevos);

            if (!mismo) {
                await HorarioVeterinario.updateMany(
                    { id_veterinario, eliminado: false },
                    { $set: { eliminado: true, activo: false } }
                );

                if (nuevos.length > 0) {
                    await HorarioVeterinario.insertMany(
                        nuevos.map((h) => ({
                            id_veterinario,
                            dia_semana: h.dia_semana,
                            hora_inicio: h.hora_inicio,
                            hora_fin: h.hora_fin,
                            activo: h.activo,
                            eliminado: false,
                        }))
                    );
                }
            }
        } // ✅ CIERRA: if (horarios !== undefined)

        // 6) devolver veterinario actualizado con usuario + horarios
        const vetFinal = await Veterinario.findById(id_veterinario)
            .populate("id_usuario", "nombre_completo correo numero_celular")
            .lean();

        const horariosFinal = await HorarioVeterinario.find({
            id_veterinario,
            eliminado: false,
        })
            .sort({ dia_semana: 1, hora_inicio: 1 })
            .lean();

        return {
            veterinario: {
                id: vetFinal._id,
                especialidad: vetFinal.especialidad,
                usuario: vetFinal.id_usuario,
            },
            horarios: horariosFinal.map((h) => ({
                id: h._id,
                dia_semana: h.dia_semana,
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                activo: h.activo,
            })),
        };
    }
}

module.exports = new VeterinarioService();
