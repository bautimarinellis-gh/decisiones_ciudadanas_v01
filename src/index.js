import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import propuestaRoutes from './routes/propuestaRoute.js'
import usuarioRoutes from './routes/usuarioRoute.js'
import authRoutes from './routes/authRoute.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((error) => {
    console.error('Error conectando a MongoDB:', error.message)
    process.exit(1)
  })

app.get('/', (req, res) => {
  res.json({
    message: 'API de Decisiones Ciudadanas',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      propuestas: '/api/propuestas',
      usuarios: '/api/usuarios'
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/propuestas', propuestaRoutes)
app.use('/api/usuarios', usuarioRoutes)

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`)
})