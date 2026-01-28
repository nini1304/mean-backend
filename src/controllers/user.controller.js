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

exports.listarDuenos = async (req, res) => {
  try {
    const clientes = await userService.listarUsuariosPorRolNombre("CLIENTE");
    res.json(clientes);
  } catch (error) {
    console.error("Error al listar clientes:", error);
    res.status(500).json({ message: "Error al listar clientes" });
  }
};

exports.listarClientesActivos = async (req, res) => {
  try {
    const clientes = await userService.listarClientesActivos();
    res.json(clientes);
  } catch (error) {
    console.error("Error al listar clientes activos:", error);
    res.status(500).json({ message: "Error al listar clientes activos" });
  }
};

exports.listarUsuariosActivosSinVeterinario = async (req, res) => {
  try {
    const usuarios = await userService.listarUsuariosActivosSinVeterinario();
    res.json(usuarios);
  } catch (error) {
    console.error("Error listando usuarios sin VETERINARIO:", error);
    res.status(500).json({ message: "Error al listar usuarios" });
  }
};

exports.crearUsuarioConContrasena = async (req, res) => {
  try {
    const creado = await userService.crearUsuarioConContrasena(req.body);
    res.status(201).json({ message: "Usuario creado", data: creado });
  } catch (error) {
    console.error("Error creando usuario con contraseña:", error);

    const map = {
      VALIDACION: 400,
      ROL_NO_ENCONTRADO: 404,
      CORREO_DUPLICADO: 409,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });

    // por si igual se dispara el 11000 de Mongo
    if (error.code === 11000) return res.status(409).json({ message: "El correo ya está registrado" });

    res.status(500).json({ message: "Error al crear usuario" });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await userService.actualizarUsuario(id, req.body);
    res.json({ message: "Usuario actualizado", data: actualizado });
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    const map = {
      VALIDACION: 400,
      NO_ENCONTRADO: 404,
      ROL_NO_ENCONTRADO: 404,
      CORREO_DUPLICADO: 409,
    };

    if (map[error.code]) return res.status(map[error.code]).json({ message: error.message });

    if (error.code === 11000) return res.status(409).json({ message: "El correo ya está registrado" });

    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// DELETE /api/users/:id (borrado lógico)
exports.eliminarUsuarioLogico = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await userService.eliminarUsuarioLogico(id);
    res.json({ message: "Usuario eliminado lógicamente", data: actualizado });
  } catch (error) {
    console.error("Error eliminando usuario:", error);

    if (error.code === "NO_ENCONTRADO") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

