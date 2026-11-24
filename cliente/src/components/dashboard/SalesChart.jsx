
import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';

const SalesChart = ({ datos = [] }) => {

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Sin fecha';

        // Extrae YYYY-MM-DD sin alterar el día por zonas horarias.
        const fechaTexto = String(fecha).substring(0, 10);
        const partes = fechaTexto.split('-');

        if (partes.length !== 3 || partes.some(p => !p)) {
            return 'Fecha inválida';
        }

        const [anio, mes, dia] = partes;

        return `${dia}/${mes}`;
    };

    const datosGrafico = datos.map(item => ({
        fecha: formatearFecha(item.fecha),
        ventas: Number(item.ventas || 0),
        ingresos: Number(item.ingresos || 0)
    }));

    const moneda = (valor) =>
        `S/ ${Number(valor || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <h2 className="text-lg font-bold text-slate-800">
                Evolución de ventas
            </h2>

            <p className="text-sm text-slate-500 mb-5">
                Comparación entre importe vendido y dinero cobrado
            </p>

            {datosGrafico.length > 0 ? (
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datosGrafico}>
                            <defs>
                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>

                                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />

                            <YAxis
                                tickFormatter={(valor) => `S/${valor}`}
                                tick={{ fontSize: 11 }}
                                width={75}
                            />

                            <Tooltip formatter={(valor) => moneda(valor)} />
                            <Legend />

                            <Area
                                type="monotone"
                                dataKey="ventas"
                                name="Total vendido"
                                stroke="#4f46e5"
                                fill="url(#colorVentas)"
                                strokeWidth={2}
                            />

                            <Area
                                type="monotone"
                                dataKey="ingresos"
                                name="Total cobrado"
                                stroke="#0d9488"
                                fill="url(#colorIngresos)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                    No existen ventas registradas en este período.
                </div>
            )}

        </div>
    );
};

export default SalesChart;
