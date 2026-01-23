const HorarioVeterinario = require("../models/horario_veterinario.model");
const Veterinario = require("../models/veterinario.model");

function validarHHMM(hhmm) {
  return typeof hhmm === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(hhmm);
}

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

class HorarioVeterinarioService {
  async guardarHorario(data) {
    const { id_veterinario, dia_semana, hora_inicio, hora_fin, activo } = data;

    if (!id_veterinario || dia_semana === undefined || dia_semana === null || !hora_inicio || !hora_fin) {
      const err = new Error("Campos obligatorios: id_veterinario, dia_semana, hora_inicio, hora_fin");
      err.code = "VALIDACION";
      throw err;
    }

    const dia = Number(dia_semana);
    if (Number.isNaN(dia) || dia < 0 || dia > 6) {
      const err = new Error("dia_semana debe estar entre 0 y 6");
      err.code = "VALIDACION";
      throw err;
    }

    if (!validarHHMM(hora_inicio) || !validarHHMM(hora_fin)) {
      const err = new Error("hora_inicio/hora_fin debe tener formato HH:MM (ej: 08:00)");
      err.code = "VALIDACION";
      throw err;
    }

    const ini = hhmmToMinutes(hora_inicio);
    const fin = hhmmToMinutes(hora_fin);
    if (fin <= ini) {
      const err = new Error("hora_fin debe ser mayor que hora_inicio");
      err.code = "VALIDACION";
      throw err;
    }

    // validar veterinario existe
    const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false }).lean();
    if (!vet) {
      const err = new Error("Veterinario no encontrado o eliminado");
      err.code = "VET_NO_ENCONTRADO";
      throw err;
    }

    // Upsert: si ya existe horario para ese día, lo actualiza
    const doc = await HorarioVeterinario.findOneAndUpdate(
      { id_veterinario, dia_semana: dia },
      {
        $set: {
          hora_inicio,
          hora_fin,
          activo: activo !== undefined ? !!activo : true,
          eliminado: false,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return doc;
  }

  async listarPorVeterinario(id_veterinario) {
    return await HorarioVeterinario.find({
      id_veterinario,
      eliminado: false,
    })
      .sort({ dia_semana: 1 })
      .lean();
  }

  async listarTodos() {
    return await HorarioVeterinario.find({ eliminado: false })
      .sort({ id_veterinario: 1, dia_semana: 1 })
      .lean();
  }

  async desactivarHorario(id_veterinario, dia_semana) {
    const dia = Number(dia_semana);
    if (Number.isNaN(dia) || dia < 0 || dia > 6) {
      const err = new Error("dia_semana debe estar entre 0 y 6");
      err.code = "VALIDACION";
      throw err;
    }

    const actualizado = await HorarioVeterinario.findOneAndUpdate(
      { id_veterinario, dia_semana: dia, eliminado: false },
      { $set: { activo: false } },
      { new: true }
    ).lean();

    if (!actualizado) {
      const err = new Error("Horario no encontrado");
      err.code = "NO_ENCONTRADO";
      throw err;
    }

    return actualizado;
  }

  async borrarLogico(id_veterinario, dia_semana) {
    const dia = Number(dia_semana);
    if (Number.isNaN(dia) || dia < 0 || dia > 6) {
      const err = new Error("dia_semana debe estar entre 0 y 6");
      err.code = "VALIDACION";
      throw err;
    }

    const actualizado = await HorarioVeterinario.findOneAndUpdate(
      { id_veterinario, dia_semana: dia, eliminado: false },
      { $set: { eliminado: true, activo: false } },
      { new: true }
    ).lean();

    if (!actualizado) {
      const err = new Error("Horario no encontrado");
      err.code = "NO_ENCONTRADO";
      throw err;
    }

    return actualizado;
  }
}

module.exports = new HorarioVeterinarioService();
