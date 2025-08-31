import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown'
        return `login_${req.ip}_${email}`
    },
    onLimitReached: (req, res) => {
        console.log(`🚨 Rate limit alcanzado para login: IP ${req.ip}, Email: ${req.body?.email}`)
    }
})

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `register_${req.ip}`
    },
    onLimitReached: (req, res) => {
        console.log(`🚨 Rate limit alcanzado para registro: IP ${req.ip}`)
    }
})

export const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Demasiadas solicitudes de reset de contraseña. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = req.body?.email || 'unknown'
        return `reset_${req.ip}_${email}`
    },
    onLimitReached: (req, res) => {
        console.log(`🚨 Rate limit alcanzado para reset password: IP ${req.ip}, Email: ${req.body?.email}`)
    }
})

export const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Demasiados intentos de cambio de contraseña. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const userId = req.user?.userId || req.ip
        return `change_password_${userId}`
    },
    onLimitReached: (req, res) => {
        console.log(`🚨 Rate limit alcanzado para cambio de contraseña: Usuario ${req.user?.userId}`)
    }
})

export const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo más tarde.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    onLimitReached: (req, res) => {
        console.log(`🚨 Rate limit general alcanzado: IP ${req.ip}, Endpoint: ${req.path}`)
    }
})

export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Límite de solicitudes alcanzado para este endpoint. Intenta de nuevo en 1 hora.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false,
    onLimitReached: (req, res) => {
        console.log(`🚨 Rate limit estricto alcanzado: IP ${req.ip}, Endpoint: ${req.path}`)
    }
})
