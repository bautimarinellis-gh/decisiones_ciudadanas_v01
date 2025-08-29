import express from 'express'
import {
    register,
    login,
    getProfile,
    verifyToken
} from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST /api/auth/register - Registro de usuario
router.post('/register', register)

// POST /api/auth/login - Login de usuario
router.post('/login', login)

// GET /api/auth/profile - Obtener perfil del usuario logueado (requiere token)
router.get('/profile', authenticateToken, getProfile)

// POST /api/auth/verify - Verificar si el token es válido (requiere token)
router.post('/verify', authenticateToken, verifyToken)

export default router
