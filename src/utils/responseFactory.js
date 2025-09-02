/**
 * Factory para crear respuestas HTTP estandarizadas
 * Elimina la duplicación de código en los controladores
 */
export class ResponseFactory {
    /**
     * Crear respuesta de éxito
     * @param {*} data - Datos a devolver
     * @param {string} message - Mensaje de éxito
     * @param {number} statusCode - Código de estado HTTP
     * @returns {Object} Respuesta estandarizada
     */
    static success(data = null, message = 'Operación exitosa', statusCode = 200) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString()
        }
        
        if (data !== null) {
            response.data = data
        }
        
        return response
    }

    /**
     * Crear respuesta de error
     * @param {string} message - Mensaje de error
     * @param {number} statusCode - Código de estado HTTP
     * @param {*} details - Detalles adicionales del error
     * @returns {Object} Respuesta de error estandarizada
     */
    static error(message, statusCode = 500, details = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        }
        
        if (details !== null) {
            response.details = details
        }
        
        return response
    }

    /**
     * Crear respuesta de error de validación
     * @param {Array} errors - Array de errores de validación
     * @param {string} message - Mensaje personalizado (opcional)
     * @returns {Object} Respuesta de error de validación
     */
    static validationError(errors, message = 'Error de validación') {
        return {
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Crear respuesta de error 400 (Bad Request)
     * @param {string} message - Mensaje de error
     * @param {*} details - Detalles adicionales
     * @returns {Object} Respuesta de error 400
     */
    static badRequest(message, details = null) {
        return this.error(message, 400, details)
    }

    /**
     * Crear respuesta de error 401 (Unauthorized)
     * @param {string} message - Mensaje de error
     * @returns {Object} Respuesta de error 401
     */
    static unauthorized(message = 'No autorizado') {
        return this.error(message, 401)
    }

    /**
     * Crear respuesta de error 403 (Forbidden)
     * @param {string} message - Mensaje de error
     * @returns {Object} Respuesta de error 403
     */
    static forbidden(message = 'Acceso denegado') {
        return this.error(message, 403)
    }

    /**
     * Crear respuesta de error 404 (Not Found)
     * @param {string} message - Mensaje de error
     * @returns {Object} Respuesta de error 404
     */
    static notFound(message = 'Recurso no encontrado') {
        return this.error(message, 404)
    }

    /**
     * Crear respuesta de error 500 (Internal Server Error)
     * @param {string} message - Mensaje de error
     * @param {*} details - Detalles del error
     * @returns {Object} Respuesta de error 500
     */
    static internalError(message = 'Error interno del servidor', details = null) {
        return this.error(message, 500, details)
    }

    /**
     * Crear respuesta de éxito con conteo
     * @param {Array} data - Array de datos
     * @param {string} message - Mensaje de éxito
     * @returns {Object} Respuesta con conteo
     */
    static successWithCount(data, message = 'Datos obtenidos exitosamente') {
        return {
            success: true,
            message,
            count: data.length,
            data,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Crear respuesta de éxito con filtros
     * @param {Array} data - Array de datos
     * @param {Object} filtros - Filtros aplicados
     * @param {string} message - Mensaje de éxito
     * @returns {Object} Respuesta con filtros
     */
    static successWithFilters(data, filtros, message = 'Datos filtrados obtenidos exitosamente') {
        return {
            success: true,
            message,
            count: data.length,
            filtros,
            data,
            timestamp: new Date().toISOString()
        }
    }
}
