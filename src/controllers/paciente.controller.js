const pacienteService = require("../services/paciente.service");

exports.registrarDuenoConMascotas = async (req, res) => {
  try {
    const { dueno, mascotas } = req.body;

    if (!dueno || !mascotas || !Array.isArray(mascotas) || mascotas.length === 0) {
      return res.status(400).json({
        message: "Debe enviarse 'dueno' y un arreglo 'mascotas' con al menos 1 elemento.",
      });
    }

    // Validación mínima del dueño
    const { nombre_completo, correo, numero_celular } = dueno;
    if (!nombre_completo || !correo || !numero_celular) {
      return res.status(400).json({
        message: "Campos obligatorios en 'dueno': nombre_completo, correo, numero_celular.",
      });
    }

    const creado = await pacienteService.registrarDuenoConMascotas({ dueno, mascotas });

    res.status(201).json({
      message: "Registro creado correctamente",
      data: creado,
    });
  } catch (error) {
    console.error("Error registrando dueño con mascotas:", error);

    // Duplicado de correo (unique)
    if (error.code === 11000) {
      return res.status(409).json({ message: "Ya existe un usuario con ese correo" });
    }

    if (error.code === "ROL_DUENO_NO_EXISTE") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al registrar dueño y mascotas" });
  }
};
