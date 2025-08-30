import express from 'express'
import {
    crearComentario,
    getComentariosPorPropuesta,
    eliminarComentario,
    getEstadisticasComentarios,
    getComentariosUsuario
} from '../controllers/comentarioController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST /api/comentarios - Crear un comentario (requiere autenticación)
router.post('/', authenticateToken, crearComentario)

// GET /api/comentarios/mis-comentarios - Obtener comentarios del usuario actual
router.get('/mis-comentarios', authenticateToken, getComentariosUsuario)

// GET /api/comentarios/propuesta/:propuestaId - Obtener comentarios de una propuesta
router.get('/propuesta/:propuestaId', getComentariosPorPropuesta)

// GET /api/comentarios/propuesta/:propuestaId/stats - Obtener estadísticas de comentarios
router.get('/propuesta/:propuestaId/stats', getEstadisticasComentarios)

// DELETE /api/comentarios/:comentarioId - Eliminar comentario (solo el propietario)
router.delete('/:comentarioId', authenticateToken, eliminarComentario)

export default router
