import express from 'express'
import {
    crearVoto,
    getVotosPorPropuesta,
    getEstadisticasVotos,
    verificarVotoUsuario,
    getVotosUsuario
} from '../controllers/votoController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST /api/votos - Crear un voto (votar en una propuesta)
router.post('/', authenticateToken, crearVoto)

// GET /api/votos/mis-votos - Obtener historial de votos del usuario actual
router.get('/mis-votos', authenticateToken, getVotosUsuario)

// GET /api/votos/propuesta/:propuestaId - Obtener todos los votos de una propuesta
router.get('/propuesta/:propuestaId', getVotosPorPropuesta)

// GET /api/votos/propuesta/:propuestaId/stats - Obtener estadísticas de votos
router.get('/propuesta/:propuestaId/stats', getEstadisticasVotos)

// GET /api/votos/propuesta/:propuestaId/mi-voto - Verificar si el usuario actual ya votó
router.get('/propuesta/:propuestaId/mi-voto', authenticateToken, verificarVotoUsuario)

export default router
