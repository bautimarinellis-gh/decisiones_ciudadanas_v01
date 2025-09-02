import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import propuestaRoutes from './routes/propuestaRoute.js'
import usuarioRoutes from './routes/usuarioRoute.js'
import authRoutes from './routes/authRoute.js'
import votoRoutes from './routes/votoRoute.js'
import comentarioRoutes from './routes/comentarioRoute.js'
import { generalApiLimiter } from './middleware/rateLimitMiddleware.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting general para toda la API
app.use('/api/', generalApiLimiter)

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')))

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((error) => {
    console.error('Error conectando a MongoDB:', error.message)
    process.exit(1)
  })

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Ruta para información de la API (opcional, para desarrollo)
app.get('/api', (req, res) => {
  res.json({
    message: 'API de Decisiones Ciudadanas',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      propuestas: '/api/propuestas',
      usuarios: '/api/usuarios',
      votos: '/api/votos',
      comentarios: '/api/comentarios'
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/propuestas', propuestaRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/votos', votoRoutes)
app.use('/api/comentarios', comentarioRoutes)

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`)
})