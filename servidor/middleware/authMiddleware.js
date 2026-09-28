const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Obtener el encabezado Authorization
        const authHeader = req.headers.authorization;

        // Verificar que exista
        if (!authHeader) {
            return res.status(401).json({
                message: 'Token de autenticación requerido'
            });
        }

        // Verificar formato Bearer TOKEN
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Formato de token inválido'
            });
        }

        // Extraer solamente el token
        const token = authHeader.split(' ')[1];

        // Verificar JWT
        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guardar información del usuario en la petición
        req.usuario = usuario;

        // Continuar hacia la ruta
        next();

    } catch (error) {
        console.error('Error verificando JWT:', error.message);

        return res.status(401).json({
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = authMiddleware;