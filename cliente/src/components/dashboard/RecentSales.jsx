
import React from 'react';
import { ReceiptText } from 'lucide-react';

const RecentSales = ({ datos = [] }) => {

    const moneda = (valor) =>
        `S/ ${Number(valor || 0).toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const fecha = (valor) => {
        if (!valor) return '-';

        return new Date(valor).toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'            
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center gap-2 mb-5">
                <ReceiptText className="text-slate-600" size={22} />

                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Ventas Registradas 
                    </h2>

                    <p className="text-sm text-slate-500">
                        Operaciones comerciales recientes
                    </p>
                </div>
            </div>

            {datos.length > 0 ? (

                <div className="overflow-x-auto">

                    <table className="w-full text-sm text-left">

                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-3 pr-4">Comprobante</th>
                                <th className="py-3 pr-4">Comprador</th>
                                <th className="py-3 pr-4">Tipo</th>
                                <th className="py-3 pr-4">Fecha</th>
                                <th className="py-3 pr-4">Total</th>
                                <th className="py-3">Estado</th>
                            </tr>
                        </thead>

                        <tbody>

                            {datos.map((venta, index) => (

                                <tr
                                    key={`${venta.tipo}-${venta.id}-${index}`}
                                    className="border-b border-slate-100 last:border-0"
                                >

                                    <td className="py-3 pr-4 font-semibold text-slate-700 whitespace-nowrap">
                                        {venta.numero_comprobante}
                                    </td>

                                    <td className="py-3 pr-4 text-slate-600">
                                        {venta.comprador || 'Cliente no identificado'}
                                    </td>

                                    <td className="py-3 pr-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                            venta.tipo === 'MAYORISTA'
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-teal-100 text-teal-700'
                                        }`}>
                                            {venta.tipo}
                                        </span>
                                    </td>

                                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                                        {fecha(venta.fecha)}
                                    </td>

                                    <td className="py-3 pr-4 font-semibold text-slate-800 whitespace-nowrap">
                                        {moneda(venta.total_venta)}
                                    </td>

                                    <td className="py-3">
                                        <span className={`text-xs font-semibold ${
                                            String(venta.estado_pago || '').toUpperCase() === 'PAGADO'
                                                ? 'text-green-600'
                                                : 'text-amber-600'
                                        }`}>
                                            {venta.estado_pago || 'Sin estado'}
                                        </span>
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            ) : (

                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                    No hay ventas registradas.
                </div>

            )}

        </div>
    );
};

export default RecentSales;
