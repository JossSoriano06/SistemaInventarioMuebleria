
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = function (db) {
    const router = express.Router();

    router.post('/login', async (req, res) => {
        try {
            const { nombre_usuario, password } = req.body;

            // 1. Validar datos recibidos
            if (!nombre_usuario || !password) {
                return res.status(400).json({
                    message: 'Usuario y contraseña son obligatorios'
                });
            }

            // 2. Buscar usuario en PostgreSQL
            const resultado = await db.query(
                `SELECT
                    id_usuario,
                    nombre_usuario,
                    password,
                    nombre_completo,
                    rol
                 FROM usuarios
                 WHERE nombre_usuario = $1
                 LIMIT 1`,
                [nombre_usuario]
            );

            // 3. Usuario no encontrado
            if (resultado.rows.length === 0) {
                return res.status(401).json({
                    message: 'Usuario o contraseña incorrectos'
                });
            }

            const usuario = resultado.rows[0];

            // 4. Comparar contraseña con el hash bcrypt
            const passwordCorrecta = await bcrypt.compare(
                password,
                usuario.password
            );

            if (!passwordCorrecta) {
                return res.status(401).json({
                    message: 'Usuario o contraseña incorrectos'
                });
            }

            // 5. Generar JWT
            const token = jwt.sign(
                {
                    id_usuario: usuario.id_usuario,
                    nombre_usuario: usuario.nombre_usuario,
                    rol: usuario.rol
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '8h'
                }
            );

            // 6. Responder al frontend
            return res.json({
                message: 'Login correcto',
                token,
                usuario: {
                    id_usuario: usuario.id_usuario,
                    nombre_usuario: usuario.nombre_usuario,
                    nombre_completo: usuario.nombre_completo,
                    rol: usuario.rol
                }
            });

        } catch (error) {
            console.error('Error en login:', error);

            return res.status(500).json({
                message: 'Error interno del servidor'
            });
        }
    });

    return router;
};
