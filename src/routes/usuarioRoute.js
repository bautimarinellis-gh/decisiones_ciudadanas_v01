import express from 'express'
import {
    getAllUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    getUsuariosFiltrados
} from '../controllers/usuarioController.js'
import { 
    authenticateToken, 
    requireAdmin, 
    requireOwnershipOrAdmin 
} from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/usuarios - Obtener todos los usuarios activos (solo admins)
router.get('/', authenticateToken, requireAdmin, getAllUsuarios)

// GET /api/usuarios/filtrar - Obtener usuarios filtrados (solo admins)
router.get('/filtrar', authenticateToken, requireAdmin, getUsuariosFiltrados)

// GET /api/usuarios/:id - Obtener un usuario por ID (solo admins)
router.get('/:id', authenticateToken, requireAdmin, getUsuarioById)

// PUT /api/usuarios/:id - Actualizar un usuario (solo admins)
router.put('/:id', authenticateToken, requireAdmin, updateUsuario)

// DELETE /api/usuarios/:id - Desactivar un usuario (solo admins)
router.delete('/:id', authenticateToken, requireAdmin, deleteUsuario)

export default router
