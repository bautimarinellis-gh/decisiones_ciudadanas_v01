import mongoose from 'mongoose'

const propuestaSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
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
    categoria: {
        type: String,
        required: true,
        enum: [
            'Infraestructura',
            'Seguridad',
            'Salud',
            'Educacion',
            'Medio Ambiente',
            'Transporte',
            'Cultura y Recreacion',
            'Servicios Publicos',
            'Desarrollo Social',
            'Tecnologia'
        ]
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['Pendiente', 'En Revision', 'Aprobada', 'Rechazada', 'En Ejecucion', 'Completada'],
        default: 'Pendiente'
    }
})

export default propuestaSchema
