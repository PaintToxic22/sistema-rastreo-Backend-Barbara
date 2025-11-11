const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verificarToken, verificarRol } = require('../middleware/auth');

const router = express.Router();

// Registrar nuevo usuario
router.post('/registro', async (req, res) => {
  try {
    const { email, password, nombre, rol, telefono, rut } = req.body;

    // Validaciones básicas
    if (!email || !password || !nombre) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, contraseña y nombre son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(409).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new User({
      email,
      password,
      nombre,
      rol: rol || 'usuario',
      telefono,
      rut
    });

    await nuevoUsuario.save();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario._id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar usuario',
      error: error.message 
    });
  }
});

// Login - OPCIÓN 1: SIN HASHEAR (como tu profesor)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Comparar contraseña SIN HASHEAR (como tu profesor)
    if (usuario.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario inactivo' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET || 'tu_secreto_aqui',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        telefono: usuario.telefono,
        rut: usuario.rut
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión',
      error: error.message 
    });
  }
});

// Obtener usuario actual
router.get('/me', verificarToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id).select('-password');
    res.json({
      success: true,
      usuario
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuario',
      error: error.message 
    });
  }
});

// Actualizar perfil
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { nombre, telefono, rut } = req.body;

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.usuario.id,
      { nombre, telefono, rut, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Perfil actualizado',
      usuario: usuarioActualizado
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar perfil',
      error: error.message 
    });
  }
});

// Cambiar contraseña
router.post('/cambiar-password', verificarToken, async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    const usuario = await User.findById(req.usuario.id);

    // Verificar contraseña actual - SIN HASHEAR
    if (usuario.password !== passwordActual) {
      return res.status(401).json({ 
        success: false, 
        message: 'Contraseña actual incorrecta' 
      });
    }

    // Actualizar contraseña
    usuario.password = passwordNueva;
    await usuario.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar contraseña',
      error: error.message 
    });
  }
});

module.exports = router;