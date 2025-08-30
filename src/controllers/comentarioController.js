import mongoose from 'mongoose'
import comentarioSchema from '../models/comentarioSchema.js'

// Crear el modelo de Mongoose
const Comentario = mongoose.model('Comentario', comentarioSchema)

// POST - Crear un comentario
export const crearComentario = async (req, res) => {
    try {
        const { propuestaId, contenido } = req.body
        const usuarioId = req.user.userId // Viene del middleware de autenticación

        // Validar que los campos requeridos estén presentes
        if (!propuestaId || !contenido) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta y contenido son requeridos'
            })
        }

        // Validar que el ID de propuesta sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Verificar que la propuesta existe
        const Propuesta = mongoose.model('Propuesta')
        const propuesta = await Propuesta.findById(propuestaId)
        
        if (!propuesta) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada'
            })
        }

        // Crear el comentario
        const nuevoComentario = new Comentario({
            usuarioId,
            propuestaId,
            contenido: contenido.trim()
        })

        // Guardar en la base de datos
        const comentarioGuardado = await nuevoComentario.save()

        // Popular con información del usuario para la respuesta
        const comentarioCompleto = await Comentario.findById(comentarioGuardado._id)
            .populate('usuarioId', 'nombreCompleto email')

        res.status(201).json({
            success: true,
            message: 'Comentario creado exitosamente',
            data: comentarioCompleto
        })

    } catch (error) {
        // Error de validación
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            })
        }

        // Error interno del servidor
        res.status(500).json({
            success: false,
            message: 'Error al crear el comentario',
            error: error.message
        })
    }
}

// GET - Obtener comentarios de una propuesta específica
export const getComentariosPorPropuesta = async (req, res) => {
    try {
        const { propuestaId } = req.params

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Obtener comentarios y popular información del usuario
        const comentarios = await Comentario.find({ propuestaId })
            .populate('usuarioId', 'nombreCompleto email')
            .sort({ fechaCreacion: -1 }) // Más recientes primero

        res.status(200).json({
            success: true,
            count: comentarios.length,
            data: comentarios
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los comentarios',
            error: error.message
        })
    }
}

// DELETE - Eliminar un comentario (solo el propietario puede eliminarlo)
export const eliminarComentario = async (req, res) => {
    try {
        const { comentarioId } = req.params
        const usuarioId = req.user.userId // Usuario logueado

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(comentarioId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de comentario inválido'
            })
        }

        // Buscar el comentario
        const comentario = await Comentario.findById(comentarioId)

        if (!comentario) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            })
        }

        // Verificar que el comentario pertenece al usuario logueado
        if (comentario.usuarioId.toString() !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este comentario'
            })
        }

        // Eliminar el comentario
        await Comentario.findByIdAndDelete(comentarioId)

        res.status(200).json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el comentario',
            error: error.message
        })
    }
}

// GET - Obtener estadísticas de comentarios de una propuesta
export const getEstadisticasComentarios = async (req, res) => {
    try {
        const { propuestaId } = req.params

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Contar comentarios totales
        const totalComentarios = await Comentario.countDocuments({ propuestaId })

        res.status(200).json({
            success: true,
            data: {
                propuestaId,
                totalComentarios
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de comentarios',
            error: error.message
        })
    }
}

// GET - Obtener comentarios del usuario actual
export const getComentariosUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.userId

        // Obtener comentarios del usuario con información de las propuestas
        const comentarios = await Comentario.find({ usuarioId })
            .populate('propuestaId', 'titulo categoria barrio estado')
            .sort({ fechaCreacion: -1 }) // Más recientes primero

        res.status(200).json({
            success: true,
            count: comentarios.length,
            data: comentarios
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los comentarios del usuario',
            error: error.message
        })
    }
}
