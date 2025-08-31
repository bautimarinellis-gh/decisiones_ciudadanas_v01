import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración del transportador de email
const createTransporter = () => {
    // Para Gmail (desarrollo)
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })
    }
    
    // Para SendGrid (producción)
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
        return nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        })
    }
    
    // Para SMTP genérico
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })
}

// Función para cargar y procesar plantillas de email
const loadEmailTemplate = (templateName, variables = {}) => {
    try {
        const templatesDir = path.join(__dirname, '../templates/emails')
        
        // Cargar plantilla HTML
        const htmlPath = path.join(templatesDir, `${templateName}.html`)
        let htmlTemplate = fs.readFileSync(htmlPath, 'utf8')
        
        // Cargar plantilla de texto
        const textPath = path.join(templatesDir, `${templateName}.txt`)
        let textTemplate = fs.readFileSync(textPath, 'utf8')
        
        // Reemplazar variables en ambas plantillas
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`
            htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), variables[key])
            textTemplate = textTemplate.replace(new RegExp(placeholder, 'g'), variables[key])
        })
        
        return {
            html: htmlTemplate,
            text: textTemplate
        }
    } catch (error) {
        console.error('❌ Error al cargar plantilla de email:', error.message)
        throw new Error('Error al cargar plantilla de email')
    }
}

// Función para enviar email de reset de contraseña
export const sendPasswordResetEmail = async (email, resetToken, req) => {
    try {
        const transporter = createTransporter()
        
        // Construir URL de reset
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`
        
        // Cargar plantillas con variables
        const templates = loadEmailTemplate('reset-password', {
            resetUrl,
            userEmail: email
        })
        
        // Configurar el email
        const mailOptions = {
            from: {
                name: 'Decisiones Ciudadanas',
                address: process.env.EMAIL_FROM || process.env.EMAIL_USER
            },
            to: email,
            subject: '🔐 Restablecer tu contraseña - Decisiones Ciudadanas',
            html: templates.html,
            text: templates.text
        }
        
        // Enviar el email
        const result = await transporter.sendMail(mailOptions)
        
        return {
            success: true,
            messageId: result.messageId
        }
        
    } catch (error) {
        console.error('❌ Error al enviar email de reset:', error.message)
        
        return {
            success: false,
            error: 'Error interno al enviar el email'
        }
    }
}

// Función para verificar la configuración del email
export const verifyEmailConfig = async () => {
    try {
        const transporter = createTransporter()
        await transporter.verify()
        return true
    } catch (error) {
        console.error('❌ Error en la configuración de email:', error.message)
        return false
    }
}
