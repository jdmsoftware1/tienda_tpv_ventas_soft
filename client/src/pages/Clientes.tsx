import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, DollarSign, X, ShoppingCart, CreditCard, RotateCcw, Barcode, Trash } from 'lucide-react';

interface Empleado {
  id: string;
  id_empleado: string;
  nombre: string;
}

interface Cliente {
  id: string;
  num_cliente: string;
  nombre: string;
  telefono: string;
  empleado?: Empleado;
  empleado_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface Articulo {
  id: string;
  codigo_barras: string;
  nombre: string;
  precio_venta: number;
  cantidad: number;
}

interface ItemCarrito {
  articulo_id: string;
  articulo: Articulo;
  cantidad: number;
  precio_unitario: number;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpleadoId, setFilterEmpleadoId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    num_cliente: '',
    nombre: '',
    telefono: '',
    empleado_id: '',
  });
  
  // Estados para acciones rápidas
  const [quickActionCliente, setQuickActionCliente] = useState<Cliente | null>(null);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [quickMonto, setQuickMonto] = useState('');
  const [quickDescripcion, setQuickDescripcion] = useState('');
  
  // Estados para compra con artículos
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [cantidadInput, setCantidadInput] = useState('1');
  const [descuento, setDescuento] = useState('0');
  const codigoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClientes();
    fetchEmpleados();
    fetchArticulos();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      toast.error('Error al cargar clientes');
      console.error(error);
    } finally {
      setLoading(false);
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

  // Funciones para carrito de compra
  const buscarPorCodigo = () => {
    if (!codigoBarras.trim()) return;
    const articulo = articulos.find(a => a.codigo_barras === codigoBarras.trim());
    if (!articulo) {
      toast.error('Artículo no encontrado');
      setCodigoBarras('');
      return;
    }
    agregarAlCarrito(articulo);
    setCodigoBarras('');
    codigoInputRef.current?.focus();
  };

  const agregarAlCarrito = (articulo: Articulo) => {
    const cantidad = parseInt(cantidadInput) || 1;
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    const enCarrito = carrito.find(item => item.articulo_id === articulo.id);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    if (cantidad + cantidadEnCarrito > articulo.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${articulo.cantidad - cantidadEnCarrito}`);
      return;
    }
    if (enCarrito) {
      setCarrito(carrito.map(item => 
        item.articulo_id === articulo.id 
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        articulo_id: articulo.id,
        articulo,
        cantidad,
        precio_unitario: articulo.precio_venta,
      }]);
    }
    setCantidadInput('1');
    toast.success(`${articulo.nombre} agregado`);
  };

  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  };

  const calcularTotalCarrito = () => {
    const subtotal = calcularSubtotal();
    const desc = parseFloat(descuento) || 0;
    return Math.max(0, subtotal - desc);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchClientes();
      return;
    }
    try {
      const response = await api.get(`/clientes/search/${searchTerm}`);
      setClientes([response.data]);
      toast.success('Cliente encontrado');
    } catch (error) {
      toast.error('Cliente no encontrado');
      setClientes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await api.patch(`/clientes/${editingCliente.id}`, formData);
        toast.success('Cliente actualizado correctamente');
      } else {
        await api.post('/clientes', formData);
        toast.success('Cliente creado correctamente');
      }
      setShowModal(false);
      setFormData({ num_cliente: '', nombre: '', telefono: '', empleado_id: '' });
      setEditingCliente(null);
      fetchClientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      num_cliente: cliente.num_cliente,
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      empleado_id: cliente.empleado_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente eliminado correctamente');
      fetchClientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  // Funciones para acciones rápidas
  const openQuickPago = (cliente: Cliente) => {
    setQuickActionCliente(cliente);
    setQuickMonto('');
    setShowPagoModal(true);
  };

  const openQuickCompra = (cliente: Cliente) => {
    setQuickActionCliente(cliente);
    setQuickMonto('');
    setQuickDescripcion('');
    setCarrito([]);
    setCodigoBarras('');
    setCantidadInput('1');
    setDescuento('0');
    setShowCompraModal(true);
  };

  const openQuickDevolucion = (cliente: Cliente) => {
    setQuickActionCliente(cliente);
    setQuickMonto('');
    setQuickDescripcion('');
    setShowDevolucionModal(true);
  };

  const handleQuickPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionCliente) return;
    try {
      await api.post('/pagos', {
        cliente_id: quickActionCliente.id,
        monto: parseFloat(quickMonto),
      });
      toast.success('Pago registrado correctamente');
      setShowPagoModal(false);
      fetchClientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    }
  };

  const handleQuickCompraVarios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionCliente) return;
    try {
      await api.post('/compras', {
        cliente_id: quickActionCliente.id,
        es_varios: true,
        total: parseFloat(quickMonto),
        descripcion: quickDescripcion || 'VARIOS',
      });
      toast.success('Compra registrada correctamente');
      setShowCompraModal(false);
      fetchClientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
    }
  };

  const handleQuickCompraArticulos = async () => {
    if (!quickActionCliente) return;
    if (carrito.length === 0) {
      toast.error('Agregue al menos un artículo');
      return;
    }
    try {
      const desc = parseFloat(descuento) || 0;
      await api.post('/compras', {
        cliente_id: quickActionCliente.id,
        es_varios: false,
        total: calcularTotalCarrito(),
        descripcion: desc > 0 ? `Descuento: ${formatCurrency(desc)}` : undefined,
        articulos: carrito.map(item => ({
          articulo_id: item.articulo_id,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
        })),
      });
      toast.success('Compra registrada correctamente');
      setShowCompraModal(false);
      fetchClientes();
      fetchArticulos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
    }
  };

  const handleQuickDevolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionCliente) return;
    try {
      await api.post('/devoluciones', {
        cliente_id: quickActionCliente.id,
        monto: parseFloat(quickMonto),
        descripcion: quickDescripcion,
      });
      toast.success('Devolución registrada correctamente');
      setShowDevolucionModal(false);
      fetchClientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar devolución');
    }
  };

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch =
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.num_cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpleado = !filterEmpleadoId || cliente.empleado_id === filterEmpleadoId;
    return matchesSearch && matchesEmpleado;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o número de cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                fetchClientes();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay clientes registrados</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nº Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cliente.num_cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.empleado?.nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        cliente.balance > 0
                          ? 'text-red-600'
                          : cliente.balance < 0
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      <DollarSign size={16} />
                      {formatCurrency(Math.abs(cliente.balance))}
                      {cliente.balance > 0 && ' (Debe)'}
                      {cliente.balance < 0 && ' (Favor)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botones rápidos */}
                      <button
                        onClick={() => openQuickCompra(cliente)}
                        className="p-1.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                        title="Nueva Compra"
                      >
                        <ShoppingCart size={16} />
                      </button>
                      <button
                        onClick={() => openQuickPago(cliente)}
                        className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Registrar Pago"
                      >
                        <CreditCard size={16} />
                      </button>
                      <button
                        onClick={() => openQuickDevolucion(cliente)}
                        className="p-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                        title="Registrar Devolución"
                      >
                        <RotateCcw size={16} />
                      </button>
                      {/* Separador */}
                      <span className="w-px h-5 bg-gray-300 mx-1"></span>
                      {/* Editar y Eliminar */}
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                        title="Editar Cliente"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.num_cliente}
                  onChange={(e) =>
                    setFormData({ ...formData, num_cliente: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: CLI001"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Número de teléfono"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado Asignado
                </label>
                <select
                  value={formData.empleado_id}
                  onChange={(e) =>
                    setFormData({ ...formData, empleado_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} ({emp.id_empleado})
                    </option>
                  ))}
                </select>
              </div>
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
                  {editingCliente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago Rápido */}
      {showPagoModal && quickActionCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Registrar Pago</h2>
              <button onClick={() => setShowPagoModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Cliente: <strong>{quickActionCliente.nombre}</strong>
              {quickActionCliente.balance > 0 && (
                <span className="text-red-600 ml-2">
                  (Debe: {formatCurrency(quickActionCliente.balance)})
                </span>
              )}
            </p>
            <form onSubmit={handleQuickPago}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quickMonto}
                  onChange={(e) => setQuickMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPagoModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compra Rápida - Mejorado con artículos */}
      {showCompraModal && quickActionCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nueva Compra</h2>
              <button onClick={() => setShowCompraModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Cliente: <strong>{quickActionCliente.nombre}</strong> ({quickActionCliente.num_cliente})
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel izquierdo: Agregar artículos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Barcode size={18} />
                  Agregar Artículos
                </h3>
                
                {/* Búsqueda por código de barras */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                  <div className="flex gap-2">
                    <input
                      ref={codigoInputRef}
                      type="text"
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigo()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Escanear código..."
                    />
                    <input
                      type="number"
                      min="1"
                      value={cantidadInput}
                      onChange={(e) => setCantidadInput(e.target.value)}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="Cant"
                    />
                    <button
                      type="button"
                      onClick={buscarPorCodigo}
                      className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Lista de artículos */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">O seleccionar:</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {articulos.filter(a => a.cantidad > 0).map((articulo) => (
                      <button
                        key={articulo.id}
                        type="button"
                        onClick={() => agregarAlCarrito(articulo)}
                        className="w-full text-left px-2 py-1.5 hover:bg-primary-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center text-sm"
                      >
                        <span>{articulo.nombre}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(articulo.precio_venta)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opción VARIOS */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">O registrar como VARIOS:</h4>
                  <form onSubmit={handleQuickCompraVarios} className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={quickMonto}
                      onChange={(e) => setQuickMonto(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Cantidad (€)"
                    />
                    <input
                      type="text"
                      value={quickDescripcion}
                      onChange={(e) => setQuickDescripcion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Descripción (VARIOS)"
                    />
                    <button
                      type="submit"
                      disabled={!quickMonto}
                      className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      Registrar VARIOS
                    </button>
                  </form>
                </div>
              </div>

              {/* Panel derecho: Carrito */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Carrito</h3>
                
                {carrito.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Sin artículos</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-48 overflow-y-auto mb-3">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left">Artículo</th>
                            <th className="px-2 py-1 text-center">Cant</th>
                            <th className="px-2 py-1 text-right">Subtotal</th>
                            <th className="px-2 py-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {carrito.map((item, index) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="px-2 py-1 text-gray-900">{item.articulo.nombre}</td>
                              <td className="px-2 py-1 text-center">{item.cantidad}</td>
                              <td className="px-2 py-1 text-right">{formatCurrency(item.cantidad * item.precio_unitario)}</td>
                              <td className="px-2 py-1">
                                <button
                                  type="button"
                                  onClick={() => eliminarDelCarrito(index)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(calcularSubtotal())}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Descuento:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={descuento}
                          onChange={(e) => setDescuento(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                        />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL:</span>
                        <span className="text-primary-600">{formatCurrency(calcularTotalCarrito())}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickCompraArticulos}
                        className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-semibold"
                      >
                        Registrar Compra
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCompraModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Devolución Rápida */}
      {showDevolucionModal && quickActionCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Registrar Devolución</h2>
              <button onClick={() => setShowDevolucionModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Cliente: <strong>{quickActionCliente.nombre}</strong>
            </p>
            <form onSubmit={handleQuickDevolucion}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quickMonto}
                  onChange={(e) => setQuickMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={quickDescripcion}
                  onChange={(e) => setQuickDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Motivo de la devolución"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDevolucionModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
