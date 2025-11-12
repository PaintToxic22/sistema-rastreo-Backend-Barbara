const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

    // ✅ Crear nuevo usuario (bcrypt se aplica automáticamente en pre('save'))
    const nuevoUsuario = new User({
      email,
      password, // ✅ Se hashea en el pre('save')
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

// ✅ Login - CON BCRYPT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son requeridos' 
      });
    }

    console.log('🔐 Intento de login:', email);

    // Buscar usuario
    const usuario = await User.findOne({ email });
    if (!usuario) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // ✅ Comparar contraseña con bcrypt
    const passwordValida = await usuario.compararPassword(password);
    
    console.log('🔍 Password válida:', passwordValida);
    
    if (!passwordValida) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      console.log('❌ Usuario inactivo');
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario inactivo' 
      });
    }

    // ✅ Generar JWT
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

    console.log('✅ Login exitoso para:', email);

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

    // ✅ Verificar contraseña actual CON BCRYPT
    const passwordValida = await usuario.compararPassword(passwordActual);
    
    if (!passwordValida) {
      return res.status(401).json({ 
        success: false, 
        message: 'Contraseña actual incorrecta' 
      });
    }

    // ✅ Actualizar contraseña (se hashea en pre('save'))
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