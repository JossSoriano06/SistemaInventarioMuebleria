
import React from 'react';
import {
    AlertTriangle,
    PackageX,
    Package,
    ArrowRight
} from 'lucide-react';

const LowStock = ({ datos = [], onSeleccionarProducto }) => {

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        Alertas prioritarias de inventario
                    </h2>
                    <p className="text-sm text-slate-500">
                        Productos que necesitan reposición
                    </p>
                </div>

                <AlertTriangle className="text-amber-500" size={24} />
            </div>

            {datos.length > 0 ? (
                <div className="space-y-3">

                    {datos.map((producto) => {
                        const agotado = producto.estado === 'AGOTADO';

                        return (
                            <button
                                type="button"
                                key={producto.id_producto}
                                onClick={() => onSeleccionarProducto(producto.id_producto)}
                                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition text-left group"
                            >
                                <div className="flex items-center gap-3 min-w-0">

                                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
                                        agotado
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {agotado
                                            ? <PackageX size={21} />
                                            : <Package size={21} />
                                        }
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">
                                            {producto.nombre_producto}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Stock mínimo: {producto.stock_minimo}
                                        </p>

                                        <span className={`text-[10px] font-bold ${
                                            agotado ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                            {producto.estado}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800">
                                            {producto.stock} unidades
                                        </p>
                                        <p className="text-xs text-indigo-600">
                                            Registrar entrada
                                        </p>
                                    </div>

                                    <ArrowRight
                                        size={18}
                                        className="text-slate-400 group-hover:text-indigo-600"
                                    />
                                </div>
                            </button>
                        );
                    })}

                </div>
            ) : (
                <div className="py-10 flex flex-col items-center text-center">
                    <Package className="text-green-500 mb-2" size={35} />

                    <p className="font-semibold text-slate-700">
                        Inventario saludable
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                        No hay productos que requieran reposición.
                    </p>
                </div>
            )}

        </div>
    );
};

export default LowStock;

