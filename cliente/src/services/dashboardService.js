
import axios from 'axios';

const API_URL = 'http://localhost:3004/api/dashboard';

export const obtenerResumenDashboard = async (filtros = {}) => {
    try {
        const response = await axios.get(`${API_URL}/resumen`, {
            params: filtros
        });

        return response.data;

    } catch (error) {
        console.error(
            'Error al obtener información del dashboard:',
            error
        );

        throw error;
    }
};
