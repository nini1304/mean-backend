const Cita = require("../models/cita.model");
const Veterinario = require("../models/veterinario.model");

class AgendaService {
  async listarEventos({ id_veterinario, from, to }) {
    if (!id_veterinario) {
      const err = new Error("id_veterinario es obligatorio");
      err.code = "VALIDACION";
      throw err;
    }

    const vet = await Veterinario.findOne({ _id: id_veterinario, eliminado: false }).lean();
    if (!vet) {
      const err = new Error("Veterinario no encontrado o eliminado");
      err.code = "VET_NO_ENCONTRADO";
      throw err;
    }

    const desde = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hasta = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Citas dentro del rango (considera solape con rango)
    const citas = await Cita.find({
      id_veterinario,
      eliminado: false,
      estado: { $ne: "CANCELADA" },
      inicio: { $lt: hasta },
      fin: { $gt: desde },
    })
      .populate("id_mascota", "nombre")
      .lean();

    // formato FullCalendar
    return citas.map((c) => ({
      id: c._id,
      title: `${c.id_mascota?.nombre || "Mascota"} - ${c.tipo}`,
      start: c.inicio,
      end: c.fin,
      extendedProps: {
        tipo: c.tipo,
        estado: c.estado,
        id_veterinario: c.id_veterinario,
        id_mascota: c.id_mascota?._id,
      },
    }));
  }
}

module.exports = new AgendaService();
