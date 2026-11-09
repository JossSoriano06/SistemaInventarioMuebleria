const express = require('express');

module.exports = function () {
    const router = express.Router();

    router.get('/dni/:numero', async (req, res) => {
        try {
            const { numero } = req.params;

            // Validar que el DNI tenga 8 dígitos
            if (!/^\d{8}$/.test(numero)) {
                return res.status(400).json({
                    mensaje: 'El DNI debe contener exactamente 8 dígitos.'
                });
            }

            const apiKey = process.env.DECOLECTA_API_KEY;

            if (!apiKey) {
                return res.status(500).json({
                    mensaje: 'No se configuró la clave de Decolecta.'
                });
            }

            const respuesta = await fetch(
                `https://api.decolecta.com/v1/reniec/dni?numero=${numero}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                return res.status(respuesta.status).json({
                    mensaje: datos.message || 'No se pudo consultar el DNI.'
                });
            }

            return res.json({
                dni: datos.document_number,
                nombres: datos.first_name,
                apellido_paterno: datos.first_last_name,
                apellido_materno: datos.second_last_name,
                nombre_completo: datos.full_name
            });

        } catch (error) {
            console.error('Error consultando DNI:', error);

            return res.status(500).json({
                mensaje: 'Error interno al consultar el DNI.'
            });
        }
    });

    return router;
};