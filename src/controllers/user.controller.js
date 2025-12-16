const userService = require("../services/user.service");

exports.crearUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo, numero_celular, id_rol } = req.body;

    if (!nombre_completo || !correo || !numero_celular || !id_rol) {
      return res.status(400).json({
        message:
          "Los campos 'nombre_completo', 'correo', 'numero_celular' e 'id_rol' son obligatorios",
      });
    }

    const usuario = await userService.crearUsuario({
      nombre_completo,
      correo,
      numero_celular,
      id_rol,
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await userService.listarUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ message: "Error al listar usuarios" });
  }
};
