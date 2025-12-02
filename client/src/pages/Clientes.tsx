import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, DollarSign, X, ShoppingCart, CreditCard, RotateCcw } from 'lucide-react';

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

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
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

  useEffect(() => {
    fetchClientes();
    fetchEmpleados();
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

  const handleQuickCompra = async (e: React.FormEvent) => {
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

      {/* Modal Compra Rápida */}
      {showCompraModal && quickActionCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nueva Compra (VARIOS)</h2>
              <button onClick={() => setShowCompraModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Cliente: <strong>{quickActionCliente.nombre}</strong>
            </p>
            <form onSubmit={handleQuickCompra}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quickMonto}
                  onChange={(e) => setQuickMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="VARIOS"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCompraModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Registrar
                </button>
              </div>
            </form>
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
