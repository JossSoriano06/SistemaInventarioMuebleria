
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  MdEdit,
  MdAddBox,
  MdInventory,
  MdCalculate,
  MdBarChart,
  MdCheck,
  MdClose,
  MdDelete
} from 'react-icons/md';

const API_URL = 'http://localhost:3004/api/productos';
const CONFIG_URL = 'http://localhost:3004/api/configuracion-precios';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  precio_compra: '',
  precio_mayorista: '',
  precio_minorista: ''
};

function Producto() {
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState(FORM_INICIAL);

  const [porcentajes, setPorcentajes] = useState({
    porcentaje_mayorista: 10,
    porcentaje_minorista: 5
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const [modal, setModal] = useState(null);
  const [confirmacion, setConfirmacion] = useState('');

  const dinero = (valor) =>
    `S/. ${Number(valor || 0).toFixed(2)}`;

  const obtenerError = (err) => {
    if (err.response?.status === 401) {
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    }

    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      'No se pudo completar la operación.'
    );
  };

  
  // OBTENER PRODUCTOS
  

  const fetchProductos = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      setProductos(response.data);
    } catch (err) {
      console.error('Error al obtener productos:', err);
      setConfirmacion(obtenerError(err));
    }
  }, []);

 
  // OBTENER CONFIGURACIÓN
  

  const fetchConfiguracion = useCallback(async () => {
    try {
      const response = await axios.get(CONFIG_URL);

      setPorcentajes({
        porcentaje_mayorista: Number(
          response.data.porcentaje_mayorista
        ),
        porcentaje_minorista: Number(
          response.data.porcentaje_minorista
        )
      });
    } catch (err) {
      console.error('Error al obtener configuración:', err);
      setConfirmacion(obtenerError(err));
    }
  }, []);

  useEffect(() => {
    fetchProductos();
    fetchConfiguracion();
  }, [fetchProductos, fetchConfiguracion]);

 
  // CALCULAR PRECIOS
 

  const calcularPrecios = (costo, margenes = porcentajes) => {
    if (
      costo === '' ||
      !Number.isFinite(Number(costo)) ||
      Number(costo) < 0
    ) {
      return {
        precio_mayorista: '',
        precio_minorista: ''
      };
    }

    const precio = Number(costo);

    return {
      precio_mayorista: (
        precio * (1 + Number(margenes.porcentaje_mayorista) / 100)
      ).toFixed(2),

      precio_minorista: (
        precio * (1 + Number(margenes.porcentaje_minorista) / 100)
      ).toFixed(2)
    };
  };

  
  // CAMBIOS DEL FORMULARIO
 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  
  // SOLICITAR CONFIRMACIÓN PARA CALCULAR PRECIOS
  

  const handleCalcularPrecios = () => {
    setConfirmacion('');

    if (
      formData.precio_compra === '' ||
      !Number.isFinite(Number(formData.precio_compra)) ||
      Number(formData.precio_compra) < 0
    ) {
      setConfirmacion('Ingresa un precio de compra válido.');
      return;
    }

    setModal({
      tipo: 'calcular',
      titulo: 'Se calculo correctamente los precios de venta.',
      descripcion: 'Se calcularán los precios de venta.',
      precios: calcularPrecios(formData.precio_compra)
    });
  };

  
  // SOLICITAR CONFIRMACIÓN PARA CAMBIAR PORCENTAJES
 

  const handleAplicarPorcentajes = () => {
    setConfirmacion('');

    const mayorista = Number(porcentajes.porcentaje_mayorista);
    const minorista = Number(porcentajes.porcentaje_minorista);

    if (
      porcentajes.porcentaje_mayorista === '' ||
      porcentajes.porcentaje_minorista === '' ||
      !Number.isFinite(mayorista) ||
      !Number.isFinite(minorista) ||
      mayorista < 0 ||
      mayorista > 999.99 ||
      minorista < 0 ||
      minorista > 999.99
    ) {
      setConfirmacion(
        'Los porcentajes deben estar entre 0 y 999.99.'
      );
      return;
    }

    setModal({
      tipo: 'porcentajes',
      titulo: '¿Deseas cambiar los porcentajes?',
      descripcion:
        'Se actualizarán los porcentajes y los precios de venta.',
      mayorista,
      minorista
    });
  };

  
  // SOLICITAR CONFIRMACIÓN PARA REGISTRAR O EDITAR
 

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmacion('');

    if (!formData.nombre.trim()) {
      setConfirmacion('El nombre del mueble es obligatorio.');
      return;
    }

    if (
      formData.precio_compra === '' ||
      formData.precio_mayorista === '' ||
      formData.precio_minorista === ''
    ) {
      setConfirmacion(
        'Completa los precios antes de continuar.'
      );
      return;
    }

    const datos = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      precio_compra: Number(formData.precio_compra),
      precio_mayorista: Number(formData.precio_mayorista),
      precio_minorista: Number(formData.precio_minorista)
    };

    const preciosValidos = [
      datos.precio_compra,
      datos.precio_mayorista,
      datos.precio_minorista
    ].every((precio) =>
      Number.isFinite(precio) && precio >= 0
    );

    if (!preciosValidos) {
      setConfirmacion('Verifica que los precios sean válidos.');
      return;
    }

    setModal({
      tipo: 'guardar',
      titulo: isEditing
        ? '¿Deseas guardar los cambios?'
        : '¿Deseas registrar el producto?',
      descripcion: isEditing
        ? 'Se actualizará el producto.'
        : 'Se registrará el producto.',
      datos,
      editando: isEditing
    });
  };

  
  // REGISTRAR O ACTUALIZAR PRODUCTO
  

  const guardarProductoConfirmado = async (datos, editando) => {
    try {
      setLoading(true);

      if (editando) {
        await axios.put(`${API_URL}/${currentProductId}`, datos);
      } else {
        await axios.post(API_URL, datos);
      }

      setConfirmacion(
        editando
          ? 'Se cambió correctamente.'
          : 'Se registró correctamente.'
      );

      resetFormulario();
      await fetchProductos();
    } catch (err) {
      console.error('Error al guardar el producto:', err);
      setConfirmacion(obtenerError(err));
    } finally {
      setLoading(false);
    }
  };


  // ACTUALIZAR PORCENTAJES


  const aplicarPorcentajesConfirmados = async (
    mayorista,
    minorista
  ) => {
    try {
      setLoadingConfig(true);

      await axios.put(CONFIG_URL, {
        porcentaje_mayorista: mayorista,
        porcentaje_minorista: minorista
      });

      const nuevosMargenes = {
        porcentaje_mayorista: mayorista,
        porcentaje_minorista: minorista
      };

      setPorcentajes(nuevosMargenes);

      if (formData.precio_compra !== '') {
        setFormData((prev) => ({
          ...prev,
          ...calcularPrecios(prev.precio_compra, nuevosMargenes)
        }));
      }

      await fetchProductos();
      setConfirmacion('Se cambió correctamente.');
    } catch (err) {
      console.error('Error al cambiar porcentajes:', err);
      setConfirmacion(obtenerError(err));
    } finally {
      setLoadingConfig(false);
    }
  };

  
  // CONFIRMAR ACCIÓN
  

  const confirmarAccion = async () => {
    if (!modal || loading || loadingConfig) return;

    const accion = modal;
    setModal(null);

    if (accion.tipo === 'calcular') {
      setFormData((prev) => ({
        ...prev,
        ...accion.precios
      }));

      setConfirmacion('Se calculó correctamente.');
      return;
    }

    if (accion.tipo === 'guardar') {
      await guardarProductoConfirmado(
        accion.datos,
        accion.editando
      );
      return;
    }

    if (accion.tipo === 'porcentajes') {
      await aplicarPorcentajesConfirmados(
        accion.mayorista,
        accion.minorista
      );
    }
  };

  
  // LIMPIAR FORMULARIO
  

  const resetFormulario = () => {
    setFormData(FORM_INICIAL);
    setIsEditing(false);
    setCurrentProductId(null);
  };

  
  // EDITAR PRODUCTO
 

  const handleEdit = (producto) => {
    setConfirmacion('');

    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio_compra: String(producto.precio_compra ?? 0),
      precio_mayorista: String(producto.precio_mayorista ?? 0),
      precio_minorista: String(
        producto.precio_minorista ??
        producto.precio_unitario ??
        0
      )
    });

    setCurrentProductId(producto.id);
    setIsEditing(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  // ELIMINAR PRODUCTO
 

  const handleDelete = async (producto) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${producto.nombre}"?`
    );

    if (!confirmar) return;

    setConfirmacion('');

    try {
      await axios.delete(`${API_URL}/${producto.id}`);
      setConfirmacion('Se eliminó correctamente.');

      if (currentProductId === producto.id) {
        resetFormulario();
      }

      await fetchProductos();
    } catch (err) {
      console.error('Error al eliminar el producto:', err);
      setConfirmacion(obtenerError(err));
    }
  };

  
  // ESTILOS
 
  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-base text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-5 md:px-8 md:py-2">

      

      

      {/* FORMULARIO */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">

        <div className="flex items-center gap-2 px-5 pb-3 pt-4 md:px-6">
          {isEditing ? (
            <MdEdit className="text-indigo-600" size={25} />
          ) : (
            <MdAddBox className="text-indigo-600" size={25} />
          )}

          <h2 className="text-lg font-semibold text-indigo-600 md:text-xl">
            {isEditing ? 'Editar Producto' : 'Registrar Nuevo Producto'}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-5 pb-5 md:px-6 md:pb-6"
        >

          {/* CONFIGURACIÓN DE GANANCIA */}
          <div className="grid grid-cols-1 items-center gap-4 rounded-lg border border-indigo-50 bg-indigo-50/70 p-4 lg:grid-cols-[minmax(300px,1fr)_minmax(170px,0.55fr)_minmax(170px,0.55fr)_auto]">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <MdBarChart size={28} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase text-slate-800 md:text-base">
                  Ganancia por venta
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  Define el porcentaje de ganancia para calcular los precios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-gray-200 lg:border-l lg:pl-4">
              <label
                htmlFor="porcentaje_mayorista"
                className="whitespace-nowrap text-sm font-semibold text-slate-700"
              >
                Por mayor
              </label>

              <input
                id="porcentaje_mayorista"
                type="number"
                min="0"
                max="999.99"
                step="0.01"
                value={porcentajes.porcentaje_mayorista}
                onChange={(e) =>
                  setPorcentajes((prev) => ({
                    ...prev,
                    porcentaje_mayorista: e.target.value
                  }))
                }
                className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-3 text-base outline-none focus:border-indigo-500"
                required
              />

              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-3 text-base text-gray-600">
                %
              </span>
            </div>

            <div className="flex items-center gap-2 border-gray-200 lg:border-l lg:pl-4">
              <label
                htmlFor="porcentaje_minorista"
                className="whitespace-nowrap text-sm font-semibold text-slate-700"
              >
                Por menor
              </label>

              <input
                id="porcentaje_minorista"
                type="number"
                min="0"
                max="999.99"
                step="0.01"
                value={porcentajes.porcentaje_minorista}
                onChange={(e) =>
                  setPorcentajes((prev) => ({
                    ...prev,
                    porcentaje_minorista: e.target.value
                  }))
                }
                className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-3 text-base outline-none focus:border-indigo-500"
                required
              />

              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-3 text-base text-gray-600">
                %
              </span>
            </div>

            <button
              type="button"
              onClick={handleAplicarPorcentajes}
              disabled={loadingConfig}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MdCheck size={22} />
              {loadingConfig ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>

          {/* NOMBRE Y COSTO */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="nombre"
                className="mb-1 block text-sm font-semibold text-slate-700 md:text-base"
              >
                Nombre del Mueble
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                maxLength={100}
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Escritorio de madera"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="precio_compra"
                className="mb-1 block text-sm font-semibold text-slate-700 md:text-base"
              >
                Precio de Compra
              </label>

              <input
                id="precio_compra"
                name="precio_compra"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_compra}
                onChange={handleChange}
                placeholder="0.00"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* PRECIOS DE VENTA */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="precio_mayorista"
                className="mb-1 block text-sm font-semibold text-slate-700 md:text-base"
              >
                Precio por Mayor
              </label>

              <input
                id="precio_mayorista"
                name="precio_mayorista"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_mayorista}
                onChange={handleChange}
                placeholder="0.00"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="precio_minorista"
                className="mb-1 block text-sm font-semibold text-slate-700 md:text-base"
              >
                Precio por Menor
              </label>

              <input
                id="precio_minorista"
                name="precio_minorista"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_minorista}
                onChange={handleChange}
                placeholder="0.00"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label
              htmlFor="descripcion"
              className="mb-2 block text-sm font-semibold text-slate-700 md:text-base"
            >
              Descripción (Material, color, etc.)
            </label>

            <textarea
              id="descripcion"
              name="descripcion"
              maxLength={100}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej. Madera melamina, color nogal, con 2 cajones."
              rows={3}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* ACCIONES */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCalcularPrecios}
              className="flex items-center justify-center gap-2 rounded-lg border border-indigo-500 bg-white px-5 py-3 text-base font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <MdCalculate size={21} />
              Calcular Precios
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? <MdEdit size={21} /> : <MdAddBox size={21} />}

              {loading
                ? 'Procesando...'
                : isEditing
                  ? 'Guardar Cambios'
                  : 'Registrar Producto'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={resetFormulario}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 text-base text-gray-700 hover:bg-gray-200"
              >
                <MdClose size={21} />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* TABLA */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 md:text-xl">
            <MdInventory size={25} />
            CANTIDAD DE MUEBLES
            <span className="text-indigo-600">{productos.length}</span>
          </h2>

          <button
            type="button"
            onClick={fetchProductos}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Actualizar lista
          </button>
        </div>

        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="whitespace-nowrap px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="whitespace-nowrap px-4 py-3">Precio de compra</th>
                <th className="whitespace-nowrap px-4 py-3">Precio por mayor</th>
                <th className="whitespace-nowrap px-4 py-3">Precio por menor</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="whitespace-nowrap px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {productos.map((producto) => (
                <tr
                  key={producto.id}
                  className="text-sm text-slate-700 transition hover:bg-indigo-50/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {producto.id}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {producto.nombre}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {dinero(producto.precio_compra)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {dinero(producto.precio_mayorista)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-semibold">
                    {dinero(
                      producto.precio_minorista ??
                      producto.precio_unitario
                    )}
                  </td>

                  <td className="max-w-[260px] px-4 py-3">
                    <span className="block truncate">
                      {producto.descripcion || '—'}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(producto)}
                      className="mr-4 font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(producto)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {productos.length === 0 && (
            <p className="py-8 text-center text-base text-gray-500">
              No hay productos registrados.
            </p>
          )}
        </div>
      </section>

      {/* MODAL DE CONFIRMACIÓN */}
      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onClick={() => {
            if (!loading && !loadingConfig) setModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal"
            className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pb-5 pt-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-slate-700">
                <MdCheck size={26} />
              </div>

              <h3
                id="titulo-modal"
                className="text-lg font-semibold text-slate-800"
              >
                {modal.titulo}
              </h3>

              
            </div>

            <div className="flex justify-center gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={loading || loadingConfig}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarAccion}
                disabled={loading || loadingConfig}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || loadingConfig
                  ? 'Procesando...'
                  : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Producto;
