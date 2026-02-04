const pacienteService = require("../services/paciente.service");

exports.registrarClienteConMascotas = async (req, res) => {
  try {
    const { dueno, mascotas } = req.body;

    if (!dueno || !mascotas || !Array.isArray(mascotas) || mascotas.length === 0) {
      return res.status(400).json({
        message: "Debe enviarse 'dueno' y un arreglo 'mascotas' con al menos 1 elemento.",
      });
    }


    const { nombre_completo, correo, numero_celular } = dueno;
    if (!nombre_completo || !correo || !numero_celular) {
      return res.status(400).json({
        message: "Campos obligatorios en 'dueno': nombre_completo, correo, numero_celular.",
      });
    }

    const creado = await pacienteService.registrarClienteConMascotas({
      dueno,
      mascotas
    });

    res.status(201).json({
      message: "Registro creado correctamente",
      data: creado,
    });
  } catch (error) {
    console.error("Error registrando cliente con mascotas:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Ya existe un usuario con ese correo" });
    }

    if (error.code === "ROL_CLIENTE_NO_EXISTE") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al registrar cliente y mascotas" });
  }
};

exports.registrarMascotasParaClienteExistente = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const { mascotas } = req.body;

    const creado = await pacienteService.registrarMascotasParaClienteExistente({
      id_usuario: idUsuario,
      mascotas,
    });

    res.status(201).json({
      message: "Mascotas registradas correctamente para el cliente",
      data: creado,
    });
  } catch (error) {
    console.error("Error registrando mascotas para cliente existente:", error);

    if (error.code === "USUARIO_NO_ENCONTRADO") {
      return res.status(404).json({ message: error.message });
    }

    if (error.code === "USUARIO_NO_ES_CLIENTE" || error.code === "MASCOTAS_INVALIDAS") {
      return res.status(400).json({ message: error.message });
    }

    // por si cae un duplicado (poco probable aquí, pero por consistencia)
    if (error.code === 11000) {
      return res.status(409).json({ message: "Conflicto al crear datos (duplicado)" });
    }

    res.status(500).json({ message: "Error al registrar mascotas para el cliente" });
  }
};


exports.eliminarPaciente = async (req, res) => {
  try {
    const { idMascota } = req.params;

    const result = await pacienteService.eliminarPacientePorMascota(idMascota);

    res.json(result);
  } catch (error) {
    console.error("Error eliminando paciente:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }

    if (error.code === "RELACION_NO_EXISTE") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al eliminar paciente" });
  }
};

exports.actualizarPacientePorMascota = async (req, res) => {
  try {
    const { idMascota } = req.params;
    const { mascota, dueno } = req.body;

    if (!mascota && !dueno) {
      return res.status(400).json({
        message: "Debes enviar al menos 'mascota' o 'dueno' para actualizar.",
      });
    }

    const actualizado = await pacienteService.actualizarPacientePorMascota(idMascota, {
      mascota,
      dueno,
    });

    res.json({
      message: "Paciente actualizado correctamente",
      data: actualizado,
    });
  } catch (error) {
    console.error("Error actualizando paciente:", error);

    if (error.code === "MASCOTA_NO_ENCONTRADA") {
      return res.status(404).json({ message: error.message });
    }

    if (error.code === "RELACION_NO_EXISTE") {
      return res.status(400).json({ message: error.message });
    }

    // correo duplicado si cambias correo del dueño
    if (error.code === 11000) {
      return res.status(409).json({ message: "Ya existe un usuario con ese correo" });
    }

    res.status(500).json({ message: "Error al actualizar paciente" });
  }
};

