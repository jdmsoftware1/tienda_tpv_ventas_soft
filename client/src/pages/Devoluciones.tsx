import { useState, useEffect } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import DateFilters from '../components/DateFilters';

interface Empleado {
  id: string;
  id_empleado: string;
  nombre: string;
}

interface Cliente {
  id: string;
  num_cliente: string;
  nombre: string;
  balance: number;
  empleado_id: string;
  empleado?: Empleado;
}

interface Devolucion {
  id: string;
  cliente: Cliente;
  monto: number;
  descripcion: string;
  created_at: string;
}

export default function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmpleadoId, setFilterEmpleadoId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    monto: '',
    descripcion: '',
  });

  useEffect(() => {
    fetchDevoluciones();
    fetchClientes();
    fetchEmpleados();
  }, []);

  const fetchDevoluciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/devoluciones');
      setDevoluciones(response.data);
    } catch (error) {
      toast.error('Error al cargar devoluciones');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        cliente_id: formData.cliente_id,
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
      };

      await api.post('/devoluciones', payload);
      toast.success('Devolución registrada correctamente');
      setShowModal(false);
      setFormData({ cliente_id: '', monto: '', descripcion: '' });
      fetchDevoluciones();
      fetchClientes(); // Refresh to update balances
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar devolución');
    }
  };

  const openCreateModal = () => {
    setFormData({ cliente_id: '', monto: '', descripcion: '' });
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Limpiar filtros de fecha
  const clearDateFilters = () => {
    setFilterType('');
    setFechaInicio('');
    setFechaFin('');
  };

  // Filtrar devoluciones por empleado y fecha
  const filteredDevoluciones = devoluciones.filter((devolucion) => {
    if (filterEmpleadoId) {
      const cliente = clientes.find(c => c.id === devolucion.cliente.id);
      if (cliente?.empleado_id !== filterEmpleadoId) return false;
    }
    
    if (fechaInicio || fechaFin) {
      const devDate = new Date(devolucion.created_at);
      devDate.setHours(0, 0, 0, 0);
      
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        if (devDate < inicio) return false;
      }
      
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        if (devDate > fin) return false;
      }
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Devoluciones</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Registrar Devolución
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 space-y-4">
        <DateFilters
          filterType={filterType}
          setFilterType={setFilterType}
          fechaInicio={fechaInicio}
          setFechaInicio={setFechaInicio}
          fechaFin={fechaFin}
          setFechaFin={setFechaFin}
          onClear={clearDateFilters}
        />
        
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <label className="text-sm font-medium text-gray-700">Empleado:</label>
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

        {(filterEmpleadoId || fechaInicio || fechaFin) && (
          <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
            Mostrando <strong>{filteredDevoluciones.length}</strong> de <strong>{devoluciones.length}</strong> devoluciones
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : filteredDevoluciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay devoluciones registradas</div>
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
                  Nº Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Actual
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevoluciones.map((devolucion) => (
                <tr key={devolucion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(devolucion.created_at).toLocaleString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {devolucion.cliente.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {devolucion.cliente.num_cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                    <div className="flex items-center gap-1">
                      <RotateCcw size={16} />
                      {formatCurrency(devolucion.monto)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {devolucion.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      devolucion.cliente.balance > 0 ? 'text-red-600' : devolucion.cliente.balance < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {formatCurrency(Math.abs(devolucion.cliente.balance))}
                      {devolucion.cliente.balance > 0 && ' (Debe)'}
                      {devolucion.cliente.balance < 0 && ' (Favor)'}
                    </span>
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
              <h2 className="text-xl font-bold text-gray-900">Registrar Devolución</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <div className="relative">
                  <RotateCcw className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  La devolución reduce el saldo del cliente
                </p>
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
                  placeholder="Motivo de la devolución (opcional)"
                />
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
