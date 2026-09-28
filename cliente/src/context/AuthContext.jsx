import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const BASE_URL = 'http://localhost:3004';

export const AuthProvider = ({ children }) => {

    const tokenInicial = localStorage.getItem('token');
    const usuarioInicial = localStorage.getItem('usuario');

    const [token, setToken] = useState(tokenInicial);
    const [usuario, setUsuario] = useState(
        usuarioInicial ? JSON.parse(usuarioInicial) : null
    );

    // Si ya existe un token, configurarlo en Axios
    if (tokenInicial) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokenInicial}`;
    }

    const login = async (nombre_usuario, password) => {

        try {

            const response = await axios.post(
                `${BASE_URL}/api/auth/login`,
                {
                    nombre_usuario,
                    password
                }
            );

            const { token, usuario } = response.data;

            // Guardar información
            localStorage.setItem('token', token);
            localStorage.setItem('usuario', JSON.stringify(usuario));

            // Actualizar estados
            setToken(token);
            setUsuario(usuario);

            // Configurar Axios para las siguientes peticiones
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return {
                success: true,
                usuario
            };

        } catch (error) {

            console.error('Error en login:', error);

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    'Error al iniciar sesión'
            };
        }
    };

    const logout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        delete axios.defaults.headers.common['Authorization'];

        setToken(null);
        setUsuario(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider
            value={{
                token,
                usuario,
                isAuthenticated,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};