import mongoose from 'mongoose'
import propuestaSchema from '../models/propuestaSchema.js'

// Crear el modelo de Mongoose
const Propuesta = mongoose.model('Propuesta', propuestaSchema)

// GET - Obtener todas las propuestas
export const getAllPropuestas = async (req, res) => {
    try {
        const propuestas = await Propuesta.find()
        res.status(200).json({
            success: true,
            count: propuestas.length,
            data: propuestas
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las propuestas',
            error: error.message
        })
    }
}

// GET - Obtener una propuesta por ID
export const getPropuestaById = async (req, res) => {
    try {
        const { id } = req.params
        
        // Validar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta no válido'
            })
        }

        const propuesta = await Propuesta.findById(id)
        
        if (!propuesta) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada'
            })
        }

        res.status(200).json({
            success: true,
            data: propuesta
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la propuesta',
            error: error.message
        })
    }
}

// POST - Crear una nueva propuesta
export const createPropuesta = async (req, res) => {
    try {
        const { titulo, descripcion, barrio, categoria } = req.body

        // Validar que los campos requeridos estén presentes
        if (!titulo || !descripcion || !barrio || !categoria) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: titulo, descripcion, barrio, categoria'
            })
        }

        // Crear nueva propuesta
        const nuevaPropuesta = new Propuesta({
            titulo,
            descripcion,
            barrio,
            categoria
        })

        // Guardar en la base de datos
        const propuestaGuardada = await nuevaPropuesta.save()

        res.status(201).json({
            success: true,
            message: 'Propuesta creada exitosamente',
            data: propuestaGuardada
        })
    } catch (error) {
        // Si es error de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            })
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear la propuesta',
            error: error.message
        })
    }
}

// PUT - Actualizar una propuesta
export const updatePropuesta = async (req, res) => {
    try {
        const { id } = req.params
        const { titulo, descripcion, barrio, categoria, estado } = req.body

        // Validar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta no válido'
            })
        }

        // Buscar y actualizar la propuesta
        const propuestaActualizada = await Propuesta.findByIdAndUpdate(
            id,
            { titulo, descripcion, barrio, categoria, estado },
            { 
                new: true, // Devolver el documento actualizado
                runValidators: true // Ejecutar las validaciones del esquema
            }
        )

        if (!propuestaActualizada) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Propuesta actualizada exitosamente',
            data: propuestaActualizada
        })
    } catch (error) {
        // Si es error de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            })
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar la propuesta',
            error: error.message
        })
    }
}

// DELETE - Eliminar una propuesta
export const deletePropuesta = async (req, res) => {
    try {
        const { id } = req.params

        // Validar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de propuesta no válido'
            })
        }

        // Buscar y eliminar la propuesta
        const propuestaEliminada = await Propuesta.findByIdAndDelete(id)

        if (!propuestaEliminada) {
            return res.status(404).json({
                success: false,
                message: 'Propuesta no encontrada'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Propuesta eliminada exitosamente',
            data: propuestaEliminada
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la propuesta',
            error: error.message
        })
    }
}

// GET - Obtener propuestas filtradas por barrio o categoría
export const getPropuestasFiltradas = async (req, res) => {
    try {
        const { barrio, categoria, estado } = req.query
        let filtro = {}

        // Construir filtro dinámico
        if (barrio) filtro.barrio = barrio
        if (categoria) filtro.categoria = categoria
        if (estado) filtro.estado = estado

        const propuestas = await Propuesta.find(filtro)

        res.status(200).json({
            success: true,
            count: propuestas.length,
            filtros: filtro,
            data: propuestas
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las propuestas filtradas',
            error: error.message
        })
    }
}
