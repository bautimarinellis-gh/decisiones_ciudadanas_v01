import mongoose from 'mongoose'

const usuarioSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    dni: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{7,8}$/.test(v);
            },
            message: 'DNI debe tener entre 7 y 8 dígitos'
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Email no válido'
        }
    },
    barrio: {
        type: String,
        required: true,
        enum: [
            'Centro',
            'Norte',
            'Sur',
            'Este',
            'Oeste',
            'Ninguno'
        ]
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    activo: {
        type: Boolean,
        default: true
    },
    rol: {
        type: String,
        enum: ['ciudadano', 'admin'],
        default: 'ciudadano'
    }
}, {
    timestamps: true
})

export default usuarioSchema