import express from 'express'
import {
    getAllPropuestas,
    getPropuestaById,
    createPropuesta,
    updatePropuesta,
    deletePropuesta,
    getPropuestasFiltradas
} from '../controllers/propuestaController.js'

const router = express.Router()

// GET /api/propuestas - Obtener todas las propuestas
router.get('/', getAllPropuestas)

// GET /api/propuestas/filtrar - Obtener propuestas filtradas (debe ir ANTES de /:id)
router.get('/filtrar', getPropuestasFiltradas)

// GET /api/propuestas/:id - Obtener una propuesta por ID
router.get('/:id', getPropuestaById)

// POST /api/propuestas - Crear una nueva propuesta
router.post('/', createPropuesta)

// PUT /api/propuestas/:id - Actualizar una propuesta
router.put('/:id', updatePropuesta)

// DELETE /api/propuestas/:id - Eliminar una propuesta
router.delete('/:id', deletePropuesta)

export default router
