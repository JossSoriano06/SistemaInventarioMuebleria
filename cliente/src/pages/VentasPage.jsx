
import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
    MdPointOfSale,
    MdStore,
    MdGroups,
    MdArrowForward,
    MdShoppingCart,
    MdHistory
} from 'react-icons/md';

function VentasPage() {

    const navigate = useNavigate();

    return (

        <div className="max-w-6xl mx-auto px-4 py-6">

            {/* ENCABEZADO */}

            <div className="mb-8">

                <div className="flex items-center gap-3 mb-2">

                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <MdPointOfSale size={28} />
                    </div>

                    <div>

                        <h1 className="text-2xl font-black text-slate-900">
                            Gestión de ventas
                        </h1>

                        <p className="text-sm text-slate-500">
                            Selecciona el tipo de venta que deseas realizar.
                        </p>

                    </div>

                </div>

            </div>


            {/* OPCIONES DE VENTA */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                
                {/* VENTA POR MENOR */}
              

                <button
                    onClick={() => navigate('/venta-menor')}
                    className="group text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
                >

                    <div className="flex items-start justify-between mb-6">

                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">

                            <MdStore size={34} />

                        </div>

                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            Venta individual
                        </span>

                    </div>


                    <h2 className="text-xl font-black text-slate-800 mb-2">
                        Venta por menor
                    </h2>

                    


                    <div className="space-y-3 mb-6">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                            <MdShoppingCart className="text-indigo-500" size={20} />

                            Venta por unidad

                        </div>

                       

                    </div>


                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-sm font-bold text-indigo-600">
                            Iniciar venta por menor
                        </span>

                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">

                            <MdArrowForward size={21} />

                        </div>

                    </div>

                </button>


                
                {/* VENTA POR MAYOR */}
              
                <button
                    onClick={() => navigate('/clientes')}
                    className="group text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300"
                >

                    <div className="flex items-start justify-between mb-6">

                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">

                            <MdGroups size={34} />

                        </div>

                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                            Venta mayorista
                        </span>

                    </div>


                    <h2 className="text-xl font-black text-slate-800 mb-2">
                        Venta por mayor
                    </h2>

                    


                    <div className="space-y-3 mb-6">

                        

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                            <MdShoppingCart className="text-emerald-500" size={20} />

                            Compra mayor a 6 muebles

                        </div>

                       

                    </div>


                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-sm font-bold text-emerald-600">
                            Iniciar venta por mayor
                        </span>

                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">

                            <MdArrowForward size={21} />

                        </div>

                    </div>

                </button>

            </div>


           

        </div>

    );

}

export default VentasPage;
