import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLock, MdPerson, MdLogin } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

function Login() {

    const navigate = useNavigate();
    const { login } = useAuth();

    const [nombre_usuario, setNombreUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError('');

        if (!nombre_usuario || !password) {
            setError('Ingrese usuario y contraseña');
            return;
        }

        setCargando(true);

        const resultado = await login(
            nombre_usuario,
            password
        );

        setCargando(false);

        if (resultado.success) {
            navigate('/');
        } else {
            setError(resultado.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

            <div className="w-full max-w-md">

                
                <div className="text-center mb-8">

                    <div className="flex justify-center mb-4">
                        <div className="bg-indigo-700 text-white p-4 rounded-2xl">
                            <MdLock size={40} />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-800">
                        Mueblería El Márquez
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Gestión de inventario y ventas
                    </p>

                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl shadow-lg p-8">

                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-slate-800">
                            Iniciar sesión
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Ingrese sus credenciales para continuar
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        
                        <div className="mb-5">

                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Usuario
                            </label>

                            <div className="relative">

                                <MdPerson
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={22}
                                />

                                <input
                                    type="text"
                                    value={nombre_usuario}
                                    onChange={(e) =>
                                        setNombreUsuario(e.target.value)
                                    }
                                    placeholder="Ingrese su usuario"
                                    className="w-full border border-slate-300 rounded-lg py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />

                            </div>

                        </div>

                        
                        <div className="mb-5">

                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Contraseña
                            </label>

                            <div className="relative">

                                <MdLock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={22}
                                />

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Ingrese su contraseña"
                                    className="w-full border border-slate-300 rounded-lg py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />

                            </div>

                        </div>

                       
                        {error && (
                            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                       
                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                        >

                            <MdLogin size={22} />

                            {cargando
                                ? 'Verificando...'
                                : 'Iniciar sesión'
                            }

                        </button>

                    </form>

                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Sistema de gestión comercial · El Márquez
                </p>

            </div>

        </div>
    );
}

export default Login;