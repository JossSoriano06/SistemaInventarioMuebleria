
import axios from 'axios';


const BASE_URL = process.env.REACT_APP_API_URL;

const API_URL = `${BASE_URL}/api/dashboard`;

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
