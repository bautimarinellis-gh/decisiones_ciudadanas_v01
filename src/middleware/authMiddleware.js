import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import usuarioSchema from '../models/usuarioSchema.js'
import { isTokenBlacklisted } from '../controllers/authController.js'

const Usuario = mongoose.model('Usuario', usuarioSchema)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_testing_123' 

// Middleware para verificar token JWT
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            })
        }

        // Verificar si el token está en la blacklist
        if (isTokenBlacklisted(token)) {
            return res.status(401).json({
                success: false,
                message: 'Token invalidado. Inicia sesión nuevamente'
            })
        }

        // Verificar el token
        const decoded = jwt.verify(token, JWT_SECRET)
        
        // Verificar que el usuario existe y está activo
        const usuario = await Usuario.findById(decoded.userId)
        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido o inactivo'
            })
        }

        // Agregar información del usuario al request
        req.user = {
            userId: decoded.userId,
            rol: decoded.rol
        }

        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            })
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Error en la autenticación',
            error: error.message
        })
    }
}

// Middleware para verificar rol de administrador
export const requireAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador'
        })
    }
    next()
}

// Middleware para verificar que el usuario solo acceda a sus propios datos
export const requireOwnershipOrAdmin = (req, res, next) => {
    const { id } = req.params
    
    // Si es admin, puede acceder a cualquier recurso
    if (req.user.rol === 'admin') {
        return next()
    }
    
    // Si no es admin, solo puede acceder a sus propios datos
    if (req.user.userId !== id) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo puedes acceder a tus propios datos'
        })
    }
    
    next()
}
