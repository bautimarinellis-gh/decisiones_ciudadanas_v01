import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import usuarioSchema from '../models/usuarioSchema.js'

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
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: nombreCompleto, dni, email, barrio, password'
            })
        }

        // Verificar que las contraseñas coincidan
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            })
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({
            $or: [{ email }, { dni }]
        })

        if (usuarioExistente) {
            const campo = usuarioExistente.email === email ? 'email' : 'DNI'
            return res.status(400).json({
                success: false,
                message: `Ya existe un usuario con ese ${campo}`
            })
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

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: usuarioRespuesta
        })
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            })
        }

        if (error.code === 11000) {
            const campo = Object.keys(error.keyValue)[0]
            return res.status(400).json({
                success: false,
                message: `Ya existe un usuario con ese ${campo}`
            })
        }

        res.status(500).json({
            success: false,
            message: 'Error al registrar el usuario',
            error: error.message
        })
    }
}

// POST - Login de usuario
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validar que los campos requeridos estén presentes
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            })
        }

        // Buscar usuario por email y que esté activo
        const usuario = await Usuario.findOne({ 
            email: email.toLowerCase(),
            activo: true 
        })

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            })
        }

        // Verificar la contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password)

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            })
        }

        // Generar token JWT
        const token = generarToken(usuario._id, usuario.rol)

        // Remover password de la respuesta
        const usuarioRespuesta = usuario.toObject()
        delete usuarioRespuesta.password

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            user: usuarioRespuesta
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el login',
            error: error.message
        })
    }
}

// GET - Obtener perfil del usuario logueado
export const getProfile = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación
        const usuario = await Usuario.findById(req.user.userId).select('-password')

        if (!usuario || !usuario.activo) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        res.status(200).json({
            success: true,
            data: usuario
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil',
            error: error.message
        })
    }
}

// POST - Verificar token (útil para el frontend)
export const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el token es válido (pasó por el middleware)
        const usuario = await Usuario.findById(req.user.userId).select('-password')

        if (!usuario || !usuario.activo) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Token válido',
            user: usuario
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar el token',
            error: error.message
        })
    }
}
