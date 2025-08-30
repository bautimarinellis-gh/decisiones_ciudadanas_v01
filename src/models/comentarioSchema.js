import mongoose from 'mongoose'

const comentarioSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    propuestaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Propuesta',
        required: true
    },
    contenido: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Índices para consultas eficientes
comentarioSchema.index({ propuestaId: 1, fechaCreacion: -1 }) // Comentarios por propuesta (más recientes primero)
comentarioSchema.index({ usuarioId: 1 }) // Comentarios por usuario
comentarioSchema.index({ propuestaId: 1 }) // Para contar comentarios por propuesta

export default comentarioSchema
