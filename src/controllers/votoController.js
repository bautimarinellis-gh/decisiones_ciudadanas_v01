import mongoose from 'mongoose'
import votoSchema from '../models/votoSchema.js'

// Crear el modelo de Mongoose
const Voto = mongoose.model('Voto', votoSchema)

// POST - Crear un voto (votar en una propuesta)
export const crearVoto = async (req, res) => {
    try {
        const { propuestaId } = req.body
        const usuarioId = req.user.userId // Viene del middleware de autenticación

        // Validar que propuestaId esté presente
        if (!propuestaId) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta es requerido'
            })
        }

        // Validar que el ID de propuesta sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Verificar que la propuesta existe y está en estado votable
        const Propuesta = mongoose.model('Propuesta')
        const propuesta = await Propuesta.findById(propuestaId)
        
        if (!propuesta) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada'
            })
        }

        // Verificar que la propuesta permite votación
        const estadosVotables = ['Pendiente', 'En Revision']
        if (!estadosVotables.includes(propuesta.estado)) {
            return res.status(400).json({
                success: false,
                message: `No se puede votar en propuestas con estado "${propuesta.estado}". Solo se permite votar en propuestas Pendientes o En Revisión.`
            })
        }

        // Crear el voto
        const nuevoVoto = new Voto({
            usuarioId,
            propuestaId,
            tipoVoto: 'positivo' // Solo votos positivos como definiste
        })

        // Intentar guardar (el índice único previene duplicados)
        const votoGuardado = await nuevoVoto.save()

        res.status(201).json({
            success: true,
            message: 'Voto registrado exitosamente',
            data: votoGuardado
        })

    } catch (error) {
        // Error de voto duplicado (código 11000 de MongoDB)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya has votado en esta propuesta'
            })
        }

        // Otros errores de validación
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
            message: 'Error al registrar el voto',
            error: error.message
        })
    }
}

// GET - Obtener votos de una propuesta específica
export const getVotosPorPropuesta = async (req, res) => {
    try {
        const { propuestaId } = req.params

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Obtener votos y popular información del usuario
        const votos = await Voto.find({ propuestaId })
            .populate('usuarioId', 'nombreCompleto email')
            .sort({ fechaVoto: -1 }) // Más recientes primero

        // Contar total de votos
        const totalVotos = votos.length

        res.status(200).json({
            success: true,
            count: totalVotos,
            data: votos
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los votos',
            error: error.message
        })
    }
}

// GET - Obtener estadísticas de votos de una propuesta
export const getEstadisticasVotos = async (req, res) => {
    try {
        const { propuestaId } = req.params

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Contar votos totales
        const totalVotos = await Voto.countDocuments({ propuestaId })

        res.status(200).json({
            success: true,
            data: {
                propuestaId,
                totalVotos,
                tipoVotos: {
                    positivos: totalVotos // Solo hay votos positivos
                }
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        })
    }
}

// GET - Verificar si el usuario actual ya votó en una propuesta
export const verificarVotoUsuario = async (req, res) => {
    try {
        const { propuestaId } = req.params
        const usuarioId = req.user.userId

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(propuestaId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta inválido'
            })
        }

        // Buscar si el usuario ya votó
        const votoExistente = await Voto.findOne({ usuarioId, propuestaId })

        res.status(200).json({
            success: true,
            data: {
                yaVoto: !!votoExistente,
                voto: votoExistente || null
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar el voto',
            error: error.message
        })
    }
}

// GET - Obtener historial de votos del usuario actual
export const getVotosUsuario = async (req, res) => {
    try {
        const usuarioId = req.user.userId

        // Obtener votos del usuario con información de las propuestas
        const votos = await Voto.find({ usuarioId })
            .populate('propuestaId', 'titulo categoria barrio estado')
            .sort({ fechaVoto: -1 }) // Más recientes primero

        res.status(200).json({
            success: true,
            count: votos.length,
            data: votos
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de votos',
            error: error.message
        })
    }
}
