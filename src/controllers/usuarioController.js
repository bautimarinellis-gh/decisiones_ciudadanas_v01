import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import usuarioSchema from '../models/usuarioSchema.js'
import { ResponseFactory } from '../utils/responseFactory.js'

// Crear el modelo de Mongoose
const Usuario = mongoose.model('Usuario', usuarioSchema)

// GET - Obtener todos los usuarios activos
export const getAllUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find({ activo: true }).select('-password')
        res.status(200).json(ResponseFactory.successWithCount(usuarios))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al obtener los usuarios', error.message))
    }
}

// GET - Obtener un usuario por ID
export const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(ResponseFactory.badRequest('ID de usuario no válido'))
        }

        const usuario = await Usuario.findOne({ _id: id, activo: true }).select('-password')
        
        if (!usuario) {
            return res.status(404).json(ResponseFactory.notFound('Usuario no encontrado'))
        }

        res.status(200).json(ResponseFactory.success(usuario))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al obtener el usuario', error.message))
    }
}



// PUT - Actualizar un usuario
export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const { nombreCompleto, email, barrio, password, activo, rol } = req.body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(ResponseFactory.badRequest('ID de usuario no válido'))
        }

        // Construir objeto de actualización
        const updateData = {}
        if (nombreCompleto) updateData.nombreCompleto = nombreCompleto
        if (email) updateData.email = email
        if (barrio) updateData.barrio = barrio
        if (activo !== undefined) updateData.activo = activo
        if (rol) updateData.rol = rol

        // Si se proporciona nueva contraseña, hashearla
        if (password) {
            const saltRounds = 10
            updateData.password = await bcrypt.hash(password, saltRounds)
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true,
                runValidators: true
            }
        ).select('-password')

        if (!usuarioActualizado) {
            return res.status(404).json(ResponseFactory.notFound('Usuario no encontrado'))
        }

        res.status(200).json(ResponseFactory.success(usuarioActualizado, 'Usuario actualizado exitosamente'))
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

        res.status(500).json(ResponseFactory.internalError('Error al actualizar el usuario', error.message))
    }
}

// DELETE - Desactivar un usuario (soft delete)
export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(ResponseFactory.badRequest('ID de usuario no válido'))
        }

        // Desactivar en lugar de eliminar
        const usuarioDesactivado = await Usuario.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        ).select('-password')

        if (!usuarioDesactivado) {
            return res.status(404).json(ResponseFactory.notFound('Usuario no encontrado'))
        }

        res.status(200).json(ResponseFactory.success(usuarioDesactivado, 'Usuario desactivado exitosamente'))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al desactivar el usuario', error.message))
    }
}

// GET - Obtener usuarios filtrados
export const getUsuariosFiltrados = async (req, res) => {
    try {
        const { barrio, rol, activo } = req.query
        let filtro = {}

        if (barrio) filtro.barrio = barrio
        if (rol) filtro.rol = rol
        if (activo !== undefined) filtro.activo = activo === 'true'

        const usuarios = await Usuario.find(filtro).select('-password')

        res.status(200).json(ResponseFactory.successWithFilters(usuarios, filtro))
    } catch (error) {
        res.status(500).json(ResponseFactory.internalError('Error al obtener los usuarios filtrados', error.message))
    }
}
