import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Eye } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Empleado {
  id: string;
  id_empleado: string;
  nombre: string;
}

interface Cliente {
  id: string;
  num_cliente: string;
  nombre: string;
  empleado_id: string;
  empleado?: Empleado;
}

interface Articulo {
  id: string;
  codigo_barras: string;
  nombre: string;
  precio_venta: number;
  cantidad: number;
}

interface CompraArticulo {
  articulo_id: string;
  cantidad: number;
  precio_unitario: number;
  articulo?: Articulo;
}

interface Compra {
  id: string;
  cliente: Cliente;
  total: number;
  descripcion: string;
  es_varios: boolean;
  articulos: CompraArticulo[];
  created_at: string;
}

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmpleadoId, setFilterEmpleadoId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [esVarios, setEsVarios] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    total: '',
    descripcion: '',
  });
  const [articulosCompra, setArticulosCompra] = useState<{ articulo_id: string; cantidad: number; precio_unitario: number }[]>([]);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState('');
  const [cantidadArticulo, setCantidadArticulo] = useState('1');

  useEffect(() => {
    fetchCompras();
    fetchClientes();
    fetchEmpleados();
    fetchArticulos();
  }, []);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compras');
      setCompras(response.data);
    } catch (error) {
      toast.error('Error al cargar compras');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const fetchArticulos = async () => {
    try {
      const response = await api.get('/articulos');
      setArticulos(response.data);
    } catch (error) {
      console.error('Error al cargar artículos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        cliente_id: formData.cliente_id,
        es_varios: esVarios,
      };

      if (esVarios) {
        payload.total = parseFloat(formData.total);
        payload.descripcion = formData.descripcion;
      } else {
        if (articulosCompra.length === 0) {
          toast.error('Debe agregar al menos un artículo');
          return;
        }
        payload.articulos = articulosCompra;
      }

      await api.post('/compras', payload);
      toast.success('Compra registrada correctamente');
      setShowModal(false);
      resetForm();
      fetchCompras();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
    }
  };

  const agregarArticulo = () => {
    if (!articuloSeleccionado || !cantidadArticulo) {
      toast.error('Seleccione un artículo y cantidad');
      return;
    }

    const articulo = articulos.find(a => a.id === articuloSeleccionado);
    if (!articulo) return;

    const cantidad = parseInt(cantidadArticulo);
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > articulo.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${articulo.cantidad}`);
      return;
    }

    setArticulosCompra([...articulosCompra, {
      articulo_id: articulo.id,
      cantidad,
      precio_unitario: articulo.precio_venta,
    }]);

    setArticuloSeleccionado('');
    setCantidadArticulo('1');
  };

  const eliminarArticulo = (index: number) => {
    setArticulosCompra(articulosCompra.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return articulosCompra.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  };

  const resetForm = () => {
    setFormData({ cliente_id: '', total: '', descripcion: '' });
    setArticulosCompra([]);
    setEsVarios(false);
    setArticuloSeleccionado('');
    setCantidadArticulo('1');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const viewDetails = (compra: Compra) => {
    setSelectedCompra(compra);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Filtrar compras por empleado
  const filteredCompras = compras.filter((compra) => {
    if (!filterEmpleadoId) return true;
    const cliente = clientes.find(c => c.id === compra.cliente.id);
    return cliente?.empleado_id === filterEmpleadoId;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Compra
        </button>
      </div>

      {/* Filtro por Empleado */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por empleado:</label>
          <select
            value={filterEmpleadoId}
            onChange={(e) => setFilterEmpleadoId(e.target.value)}
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los empleados</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
          {filterEmpleadoId && (
            <button
              onClick={() => setFilterEmpleadoId('')}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : filteredCompras.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay compras registradas</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompras.map((compra) => (
                <tr key={compra.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(compra.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {compra.cliente.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      compra.es_varios ? 'bg-purple-100 text-purple-800' : 'bg-primary-100 text-primary-800'
                    }`}>
                      {compra.es_varios ? 'VARIOS' : 'Artículos'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(compra.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {compra.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewDetails(compra)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nueva Compra</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} ({cliente.num_cliente})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={esVarios}
                    onChange={(e) => setEsVarios(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Compra de "VARIOS" (sin artículos específicos)</span>
                </label>
              </div>

              {esVarios ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Descripción de la compra"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Agregar Artículos</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={articuloSeleccionado}
                        onChange={(e) => setArticuloSeleccionado(e.target.value)}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Seleccione un artículo</option>
                        {articulos.filter(a => a.cantidad > 0).map((articulo) => (
                          <option key={articulo.id} value={articulo.id}>
                            {articulo.nombre} - {formatCurrency(articulo.precio_venta)} (Stock: {articulo.cantidad})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={cantidadArticulo}
                        onChange={(e) => setCantidadArticulo(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Cant."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={agregarArticulo}
                      className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Agregar Artículo
                    </button>
                  </div>

                  {articulosCompra.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Artículos en la compra:</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Artículo</th>
                              <th className="px-3 py-2 text-left">Cantidad</th>
                              <th className="px-3 py-2 text-left">Precio</th>
                              <th className="px-3 py-2 text-left">Subtotal</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {articulosCompra.map((item, index) => {
                              const articulo = articulos.find(a => a.id === item.articulo_id);
                              return (
                                <tr key={index} className="border-t border-gray-200">
                                  <td className="px-3 py-2">{articulo?.nombre}</td>
                                  <td className="px-3 py-2">{item.cantidad}</td>
                                  <td className="px-3 py-2">{formatCurrency(item.precio_unitario)}</td>
                                  <td className="px-3 py-2 font-semibold">{formatCurrency(item.cantidad * item.precio_unitario)}</td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => eliminarArticulo(index)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                              <td colSpan={3} className="px-3 py-2 text-right">Total:</td>
                              <td className="px-3 py-2">{formatCurrency(calcularTotal())}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalle de Compra</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{selectedCompra.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold">{new Date(selectedCompra.created_at).toLocaleString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-semibold">{selectedCompra.es_varios ? 'VARIOS' : 'Artículos'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedCompra.total)}</p>
                </div>
              </div>
              
              {selectedCompra.descripcion && (
                <div>
                  <p className="text-sm text-gray-500">Descripción</p>
                  <p className="font-semibold">{selectedCompra.descripcion}</p>
                </div>
              )}

              {!selectedCompra.es_varios && selectedCompra.articulos && selectedCompra.articulos.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Artículos</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Artículo</th>
                          <th className="px-3 py-2 text-left">Cantidad</th>
                          <th className="px-3 py-2 text-left">Precio Unit.</th>
                          <th className="px-3 py-2 text-left">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompra.articulos.map((item, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-3 py-2">{item.articulo?.nombre || 'N/A'}</td>
                            <td className="px-3 py-2">{item.cantidad}</td>
                            <td className="px-3 py-2">{formatCurrency(item.precio_unitario)}</td>
                            <td className="px-3 py-2 font-semibold">{formatCurrency(item.cantidad * item.precio_unitario)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
