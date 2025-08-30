import mongoose from 'mongoose'

const votoSchema = new mongoose.Schema({
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
    tipoVoto: {
        type: String,
        enum: ['positivo'],  // Solo votos a favor, como definiste
        required: true,
        default: 'positivo'
    },
    fechaVoto: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// CLAVE: Índice compuesto único para evitar votos duplicados
// Un usuario solo puede votar UNA VEZ por propuesta
votoSchema.index({ usuarioId: 1, propuestaId: 1 }, { unique: true })

// Índices adicionales para consultas eficientes
votoSchema.index({ propuestaId: 1 })  // Para contar votos por propuesta
votoSchema.index({ usuarioId: 1 })    // Para ver votos de un usuario

export default votoSchema