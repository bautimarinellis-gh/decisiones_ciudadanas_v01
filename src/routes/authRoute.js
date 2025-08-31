import express from 'express'
import {
    register,
    login,
    getProfile,
    verifyToken,
    changePassword,
    requestPasswordReset,
    resetPassword,
    logout
} from '../controllers/authController.js'

import { authenticateToken } from '../middleware/authMiddleware.js'
import { 
    loginLimiter, 
    registerLimiter, 
    resetPasswordLimiter, 
    changePasswordLimiter 
} from '../middleware/rateLimitMiddleware.js'

const router = express.Router()

// POST /api/auth/register - Registro de usuario (máximo 3 por hora por IP)
router.post('/register', registerLimiter, register)

// POST /api/auth/login - Login de usuario (máximo 5 intentos cada 15 min por IP+email)
router.post('/login', loginLimiter, login)

// GET /api/auth/profile - Obtener perfil del usuario logueado (requiere token)
router.get('/profile', authenticateToken, getProfile)

// POST /api/auth/verify - Verificar si el token es válido (requiere token)
router.post('/verify', authenticateToken, verifyToken)

// POST /api/auth/change-password - Cambiar contraseña (máximo 10 cada 15 min por usuario)
router.post('/change-password', changePasswordLimiter, authenticateToken, changePassword)

// POST /api/auth/request-password-reset - Solicitar reset de contraseña (máximo 3 cada 15 min por IP+email)
router.post('/request-password-reset', resetPasswordLimiter, requestPasswordReset)

// POST /api/auth/reset-password - Resetear contraseña con token
router.post('/reset-password', resetPassword)

// POST /api/auth/logout - Logout (invalidar token)
router.post('/logout', authenticateToken, logout)

export default router
