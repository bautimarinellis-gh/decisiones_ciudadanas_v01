import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import usuarioSchema from '../models/usuarioSchema.js'
import { sendPasswordResetEmail } from '../services/emailService.js'
import { ResponseFactory } from '../utils/responseFactory.js'

// Crear el modelo de Mongoose
const Usuario = mongoose.model('Usuario', usuarioSchema)

// Clave secreta para JWT (en producción debería estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_testing_123' 

// Función para generar token JWT
const generarToken = (userId, rol) => {
    return jwt.sign(
        { 
            userId, 
            rol 
        }, 
        JWT_SECRET, 
        { 
            expiresIn: '24h' // Token válido por 24 horas
        }
    )
}

// POST - Registro de usuario
export const register = async (req, res) => {
    try {
        const { nombreCompleto, dni, email, barrio, password, confirmPassword } = req.body

        // Validar que los campos requeridos estén presentes
        if (!nombreCompleto || !dni || !email || !barrio || !password) {
            return res.status(400).json(ResponseFactory.badRequest(
                'Todos los campos son requeridos: nombreCompleto, dni, email, barrio, password'
            ))
        }

        // Verificar que las contraseñas coincidan
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json(ResponseFactory.badRequest('Las contraseñas no coinciden'))
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({
            $or: [{ email }, { dni }]
        })

        if (usuarioExistente) {
            const campo = usuarioExistente.email === email ? 'email' : 'DNI'
            return res.status(400).json(ResponseFactory.badRequest(`Ya existe un usuario con ese ${campo}`))
        }

        // Hashear la contraseña
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        // Crear nuevo usuario
        const nuevoUsuario = new Usuario({
            nombreCompleto,
            dni,
            email,
            barrio,
            password: hashedPassword
        })

        // Guardar en la base de datos
        const usuarioGuardado = await nuevoUsuario.save()

        // Generar token JWT
        const token = generarToken(usuarioGuardado._id, usuarioGuardado.rol)

        // Remover password de la respuesta
        const usuarioRespuesta = usuarioGuardado.toObject()
        delete usuarioRespuesta.password

        res.status(201).json(ResponseFactory.success({
            token,
            user: usuarioRespuesta
        }, 'Usuario registrado exitosamente'))
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json(ResponseFactory.validationError(
                Object.values(error.errors).map(err => err.message)
            ))
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue)[0]
            return res.status(400).json(ResponseFactory.badRequest(`Ya existe un usuario con ese ${campo}`))
        }

        res.status(500).json(ResponseFactory.internalError('Error al registrar el usuario', error.message))
    }
}

// POST - Login de usuario
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validar que los campos requeridos estén presentes
        if (!email || !password) {
            return res.status(400).json(ResponseFactory.badRequest('Email y contraseña son requeridos'))
        }

        // Buscar usuario por email y que esté activo
        const usuario = await Usuario.findOne({ 
            email: email.toLowerCase(),
            activo: true 
        })

        if (!usuario) {
            return res.status(401).json(ResponseFactory.unauthorized('Credenciales inválidas'))
        }

        // Verificar la contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password)

        if (!passwordValida) {
            return res.status(401).json(ResponseFactory.unauthorized('Credenciales inválidas'))
        }

        // Generar token JWT
        const token = generarToken(usuario._id, usuario.rol)

        // Remover password de la respuesta
        const usuarioRespuesta = usuario.toObject()
        delete usuarioRespuesta.password

        res.status(200).json(ResponseFactory.success({
            token,
            user: usuarioRespuesta
        }, 'Login exitoso'))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error en el login', error.message))
    }
}

// GET - Obtener perfil del usuario logueado
export const getProfile = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación
        const usuario = await Usuario.findById(req.user.userId).select('-password')

        if (!usuario || !usuario.activo) {
            return res.status(404).json(ResponseFactory.notFound('Usuario no encontrado'))
        }

        res.status(200).json(ResponseFactory.success(usuario))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al obtener el perfil', error.message))
    }
}

// POST - Verificar token (útil para el frontend)
export const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el token es válido (pasó por el middleware)
        const usuario = await Usuario.findById(req.user.userId).select('-password')

        if (!usuario || !usuario.activo) {
            return res.status(404).json(ResponseFactory.notFound('Usuario no encontrado'))
        }

        res.status(200).json(ResponseFactory.success(usuario, 'Token válido'))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al verificar el token', error.message))
    }
}

// POST - Cambiar contraseña (usuario logueado)
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body
        const userId = req.user.userId

        // Validar campos requeridos
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json(ResponseFactory.badRequest('Todos los campos son requeridos'))
        }

        // Verificar que las nuevas contraseñas coincidan
        if (newPassword !== confirmPassword) {
            return res.status(400).json(ResponseFactory.badRequest('Las contraseñas nuevas no coinciden'))
        }

        // Validar fortaleza de la nueva contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json(ResponseFactory.badRequest(
                'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
            ))
        }

        // Buscar el usuario
        const usuario = await Usuario.findById(userId)
        if (!usuario || !usuario.activo) {
            return res.status(404).json(ResponseFactory.notFound('Usuario no encontrado'))
        }

        // Verificar contraseña actual
        const currentPasswordValid = await bcrypt.compare(currentPassword, usuario.password)
        if (!currentPasswordValid) {
            return res.status(400).json(ResponseFactory.badRequest('La contraseña actual es incorrecta'))
        }

        // Verificar que la nueva contraseña sea diferente a la actual
        const isSamePassword = await bcrypt.compare(newPassword, usuario.password)
        if (isSamePassword) {
            return res.status(400).json(ResponseFactory.badRequest('La nueva contraseña debe ser diferente a la actual'))
        }

        // Hashear la nueva contraseña
        const saltRounds = 10
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

        // Actualizar contraseña en la base de datos
        await Usuario.findByIdAndUpdate(userId, {
            password: hashedNewPassword,
            fechaActualizacion: new Date()
        })

        res.status(200).json(ResponseFactory.success(null, 'Contraseña cambiada exitosamente'))

    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al cambiar la contraseña', error.message))
    }
}

// Blacklist de tokens invalidados (en memoria - en producción usar Redis)
const blacklistedTokens = new Set()

// POST - Solicitar reset de contraseña
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json(ResponseFactory.badRequest('El email es requerido'))
        }

        // Buscar usuario por email
        const emailKey = email.toLowerCase()
        const usuario = await Usuario.findOne({ 
            email: emailKey,
            activo: true 
        })

        // Por seguridad, siempre responder exitosamente aunque el email no exista
        if (!usuario) {
            return res.status(200).json(ResponseFactory.success(null, 'Si el email existe, se ha enviado un enlace de recuperación'))
        }

        // Generar token de reset
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

        // Guardar token en la base de datos
        await Usuario.findByIdAndUpdate(usuario._id, {
            resetPasswordToken: resetTokenHash,
            resetPasswordExpiry: resetTokenExpiry
        })

        // Enviar email con el token
        const emailResult = await sendPasswordResetEmail(email, resetToken, req)
        
        if (!emailResult.success) {
            // Si falla el envío del email, limpiar el token de la base de datos
            await Usuario.findByIdAndUpdate(usuario._id, {
                resetPasswordToken: undefined,
                resetPasswordExpiry: undefined
            })
            
            return res.status(500).json(ResponseFactory.internalError('Error al enviar el email de recuperación. Intenta de nuevo más tarde.'))
        }



        res.status(200).json(ResponseFactory.success(null, 'Se ha enviado un enlace de recuperación a tu email'))

    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al procesar la solicitud', error.message))
    }
}

// POST - Resetear contraseña con token
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json(ResponseFactory.badRequest('Token, nueva contraseña y confirmación son requeridos'))
        }

        // Verificar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            return res.status(400).json(ResponseFactory.badRequest('Las contraseñas no coinciden'))
        }

        // Validar fortaleza de la contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json(ResponseFactory.badRequest(
                'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
            ))
        }

        // Hashear el token para comparar con la base de datos
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

        // Buscar usuario con el token válido y no expirado
        const usuario = await Usuario.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpiry: { $gt: new Date() },
            activo: true
        })

        if (!usuario) {
            return res.status(400).json(ResponseFactory.badRequest('Token inválido o expirado'))
        }

        // Hashear la nueva contraseña
        const saltRounds = 10
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

        // Actualizar contraseña y limpiar tokens de reset
        await Usuario.findByIdAndUpdate(usuario._id, {
            password: hashedNewPassword,
            resetPasswordToken: undefined,
            resetPasswordExpiry: undefined,
            fechaActualizacion: new Date()
        })

        res.status(200).json(ResponseFactory.success(null, 'Contraseña restablecida exitosamente'))

    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al restablecer la contraseña', error.message))
    }
}

// POST - Logout (invalidar token)
export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
            return res.status(400).json(ResponseFactory.badRequest('Token no proporcionado'))
        }

        // Agregar token a la blacklist
        blacklistedTokens.add(token)
        
        // Limpiar tokens expirados de la blacklist (opcional, para optimizar memoria)
        cleanExpiredTokensFromBlacklist()

        res.status(200).json(ResponseFactory.success(null, 'Logout exitoso'))

    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error en el logout', error.message))
    }
}

// Función para verificar si un token está en la blacklist
export const isTokenBlacklisted = (token) => {
    return blacklistedTokens.has(token)
}

// Función para limpiar tokens expirados de la blacklist (optimización)
const cleanExpiredTokensFromBlacklist = () => {
    try {
        const now = Math.floor(Date.now() / 1000)
        
        blacklistedTokens.forEach(token => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET)
                // Si el token ya expiró, removerlo de la blacklist
                if (decoded.exp < now) {
                    blacklistedTokens.delete(token)
                }
            } catch (error) {
                // Si el token es inválido, removerlo también
                blacklistedTokens.delete(token)
            }
        })
    } catch (error) {
        console.error('Error al limpiar blacklist:', error.message)
    }
}
