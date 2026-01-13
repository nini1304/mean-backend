const pacienteService = require("../services/paciente.service");

exports.registrarClienteConMascotas = async (req, res) => {
  try {
    const { dueno, mascotas, contrasena } = req.body;

    if (!dueno || !mascotas || !Array.isArray(mascotas) || mascotas.length === 0) {
      return res.status(400).json({
        message: "Debe enviarse 'dueno' y un arreglo 'mascotas' con al menos 1 elemento.",
      });
    }

    if (!contrasena) {
      return res.status(400).json({
        message: "El campo 'contrasena' es obligatorio.",
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
      mascotas,
      contrasena,
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
