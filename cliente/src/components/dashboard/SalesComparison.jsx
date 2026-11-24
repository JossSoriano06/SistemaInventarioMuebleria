
import React from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from 'recharts';

const SalesComparison = ({ datos = {} }) => {

    const minoristas = datos.minoristas || {};
    const mayoristas = datos.mayoristas || {};

    const informacion = [
        {
            nombre: 'Minoristas',
            valor: Number(minoristas.total_vendido || 0),
            cantidad: Number(minoristas.cantidad || 0),
            color: '#4f46e5'
        },
        {
            nombre: 'Mayoristas',
            valor: Number(mayoristas.total_vendido || 0),
            cantidad: Number(mayoristas.cantidad || 0),
            color: '#0d9488'
        }
    ];

    const total = informacion.reduce((sum, item) => sum + item.valor, 0);

    const moneda = (valor) =>
        `S/ ${Number(valor).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        console.log('Datos comparación:', datos);
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <h2 className="text-lg font-bold text-slate-800">
                Ventas por tipo
            </h2>

            <p className="text-sm text-slate-500 mb-4">
                Distribución de ventas mayoristas y minoristas
            </p>

            {total > 0 ? (

                <>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>

                                <Pie
                                    data={informacion}
                                    dataKey="valor"
                                    nameKey="nombre"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={4}
                                >
                                    {informacion.map((item) => (
                                        <Cell
                                            key={item.nombre}
                                            fill={item.color}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(valor) => moneda(valor)}
                                />

                                <Legend />

                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">

                        {informacion.map((item) => (

                            <div
                                key={item.nombre}
                                className="bg-slate-50 rounded-lg p-3"
                            >
                                <p className="text-sm text-slate-500">
                                    {item.nombre}
                                </p>

                                <p className="text-lg font-bold text-slate-800">
                                    {moneda(item.valor)}
                                </p>

                                <p className="text-xs text-slate-500 mt-1">
                                    {item.cantidad} operaciones
                                </p>
                            </div>

                        ))}

                    </div>
                </>

            ) : (

                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                    No existen ventas para comparar.
                </div>

            )}

        </div>
    );
};

export default SalesComparison;
