// routes/usuariosRoutes.js
const express = require('express');
const User = require('../models/User');
const { verificarToken, verificarRol, registrarAuditoria } = require('../middleware/auth');

const router = express.Router();

// ADMIN: Obtener todos los usuarios
router.get('/', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const { rol, pagina = 1, limite = 10 } = req.query;
    const skip = (pagina - 1) * limite;

    let filtro = {};
    if (rol) filtro.rol = rol;

    const usuarios = await User.find(filtro)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limite))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filtro);

    res.json({
      success: true,
      total,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      usuarios
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios',
      error: error.message 
    });
  }
});

// ADMIN: Obtener usuario por ID
router.get('/:id', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select('-password');

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

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

// ADMIN: Actualizar usuario
router.put('/:id', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const { nombre, telefono, rut, rol, activo } = req.body;

    const usuarioAnterior = await User.findById(req.params.id);

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.params.id,
      { nombre, telefono, rut, rol, activo, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    // Registrar auditoría
    await registrarAuditoria(
      req.usuario.id,
      'ACTUALIZAR',
      'Usuario',
      req.params.id,
      { nombre: usuarioAnterior.nombre, rol: usuarioAnterior.rol, activo: usuarioAnterior.activo },
      { nombre, rol, activo }
    );

    res.json({
      success: true,
      message: 'Usuario actualizado',
      usuario: usuarioActualizado
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar usuario',
      error: error.message 
    });
  }
});

// ADMIN: Desactivar usuario
router.post('/:id/desactivar', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { activo: false, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    // Registrar auditoría
    await registrarAuditoria(
      req.usuario.id,
      'DESACTIVAR',
      'Usuario',
      req.params.id,
      { activo: true },
      { activo: false }
    );

    res.json({
      success: true,
      message: 'Usuario desactivado',
      usuario
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al desactivar usuario',
      error: error.message 
    });
  }
});

// ADMIN: Activar usuario
router.post('/:id/activar', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { activo: true, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    // Registrar auditoría
    await registrarAuditoria(
      req.usuario.id,
      'ACTIVAR',
      'Usuario',
      req.params.id,
      { activo: false },
      { activo: true }
    );

    res.json({
      success: true,
      message: 'Usuario activado',
      usuario
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al activar usuario',
      error: error.message 
    });
  }
});

// ADMIN: Obtener estadísticas de usuarios
router.get('/stats/resumen', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const totalAdmins = await User.countDocuments({ rol: 'admin' });
    const totalOperadores = await User.countDocuments({ rol: 'operador' });
    const totalChoferes = await User.countDocuments({ rol: 'chofer' });
    const totalUsuarios = await User.countDocuments({ rol: 'usuario' });
    const totalActivos = await User.countDocuments({ activo: true });

    res.json({
      success: true,
      stats: {
        totalAdmins,
        totalOperadores,
        totalChoferes,
        totalUsuarios,
        totalActivos,
        total: totalAdmins + totalOperadores + totalChoferes + totalUsuarios
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
});

module.exports = router;