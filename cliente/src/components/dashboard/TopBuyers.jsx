
import React from 'react';
import { Trophy, ShoppingBag, CalendarDays } from 'lucide-react';

const TopBuyers = ({ datos = [] }) => {

    const moneda = (valor) =>
        `S/ ${Number(valor || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const fecha = (valor) => {
        if (!valor) return 'Sin registro';

        return new Date(valor).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between mb-5">

                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Compradores más recurrentes
                    </h2>

                    <p className="text-sm text-slate-500">
                        Clientes con mayor número de compras
                    </p>
                </div>

                <Trophy className="text-amber-500" size={25} />

            </div>

            {datos.length > 0 ? (

                <div className="space-y-4">

                    {datos.map((cliente, index) => (

                        <div
                            key={`${cliente.tipo}-${cliente.comprador}`}
                            className="flex items-center gap-3 border-b border-slate-100 pb-4 last:border-0"
                        >

                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                            }`}>
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">

                                <p className="font-semibold text-slate-800 truncate">
                                    {cliente.nombre || 'Cliente sin nombre'}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-1">

                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                        cliente.tipo === 'MAYORISTA'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-teal-100 text-teal-700'
                                    }`}>
                                        {cliente.tipo}
                                    </span>

                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <ShoppingBag size={12} />
                                        {cliente.cantidad_compras} compras
                                    </span>

                                </div>

                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                    <CalendarDays size={12} />
                                    Última compra: {fecha(cliente.ultima_compra)}
                                </p>

                            </div>

                            <div className="text-right">

                                <p className="font-bold text-slate-800 text-sm">
                                    {moneda(cliente.total_comprado)}
                                </p>

                                <p className="text-[10px] text-slate-400">
                                    Total comprado
                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            ) : (

                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                    No hay compradores registrados en este período.
                </div>

            )}

        </div>
    );
};

export default TopBuyers;
