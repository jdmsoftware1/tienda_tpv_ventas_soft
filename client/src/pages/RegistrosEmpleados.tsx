import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Clock, Download, Shield, CheckCircle, XCircle, Filter } from 'lucide-react';

interface Fichaje {
  id: string;
  empleado: {
    id: string;
    nombre: string;
    id_empleado: string;
  };
  tipo: 'entrada' | 'salida' | 'inicio_descanso' | 'fin_descanso';
  fecha_hora: string;
  ip_address: string;
  observaciones: string;
  hash: string;
  hash_anterior: string;
}

export default function RegistrosEmpleados() {
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [dateRange, setDateRange] = useState<{ inicio: Date; fin: Date } | null>(null);

  useEffect(() => {
    loadEmpleados();
    loadFichajes();
  }, []);

  const loadEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      toast.error('Error al cargar empleados');
    }
  };

  const loadFichajes = async (empleadoId?: string, fechaInicio?: Date, fechaFin?: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (empleadoId) params.append('empleadoId', empleadoId);
      if (fechaInicio) params.append('fechaInicio', fechaInicio.toISOString());
      if (fechaFin) params.append('fechaFin', fechaFin.toISOString());

      const response = await api.get(`/fichajes?${params.toString()}`);
      setFichajes(response.data);
    } catch (error) {
      toast.error('Error al cargar fichajes');
    } finally {
      setLoading(false);
    }
  };

  const verifyIntegrity = async () => {
    try {
      const response = await api.get('/fichajes/verify-integrity');
      setIntegrityStatus(response.data);
      if (response.data.valid) {
        toast.success('La cadena de fichajes es íntegra');
      } else {
        toast.error('Se detectaron alteraciones en los fichajes');
      }
    } catch (error) {
      toast.error('Error al verificar integridad');
    }
  };

  const handleFilterChange = (empleadoId: string) => {
    setSelectedEmpleado(empleadoId);
    loadFichajes(empleadoId || undefined, dateRange?.inicio, dateRange?.fin);
  };

  const handleDateRangeChange = (inicio: Date, fin: Date) => {
    setDateRange({ inicio, fin });
    loadFichajes(selectedEmpleado || undefined, inicio, fin);
  };

  const exportToCSV = () => {
    const headers = ['Fecha y Hora', 'Empleado', 'ID Empleado', 'Tipo', 'IP', 'Hash'];
    const rows = fichajes.map(f => [
      new Date(f.fecha_hora).toLocaleString('es-ES'),
      f.empleado.nombre,
      f.empleado.id_empleado,
      getTipoLabel(f.tipo),
      f.ip_address || '-',
      f.hash,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fichajes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada';
      case 'salida': return 'Salida';
      case 'inicio_descanso': return 'Inicio Descanso';
      case 'fin_descanso': return 'Fin Descanso';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'salida': return 'bg-red-100 text-red-800';
      case 'inicio_descanso': return 'bg-yellow-100 text-yellow-800';
      case 'fin_descanso': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registros de Empleados</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={verifyIntegrity}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Shield size={20} />
            Verificar Integridad
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download size={20} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estado de Integridad */}
      {integrityStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          integrityStatus.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {integrityStatus.valid ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <p className={integrityStatus.valid ? 'text-green-800' : 'text-red-800'}>
            {integrityStatus.message}
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empleado
            </label>
            <select
              value={selectedEmpleado}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos los empleados</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.id_empleado})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Fechas
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                onChange={(e) => {
                  if (e.target.value && dateRange?.fin) {
                    handleDateRangeChange(new Date(e.target.value), dateRange.fin);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="date"
                onChange={(e) => {
                  if (e.target.value && dateRange?.inicio) {
                    handleDateRangeChange(dateRange.inicio, new Date(e.target.value));
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Fichajes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : fichajes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay fichajes registrados
                  </td>
                </tr>
              ) : (
                fichajes.map((fichaje) => (
                  <tr key={fichaje.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(fichaje.fecha_hora).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {fichaje.empleado.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {fichaje.empleado.id_empleado}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(fichaje.tipo)}`}>
                        {getTipoLabel(fichaje.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fichaje.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {fichaje.hash.substring(0, 16)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Legal */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota Legal:</strong> Los registros de jornada son inmutables según la legislación española.
          Cada fichaje está protegido con un hash criptográfico SHA-256 encadenado, garantizando su integridad.
        </p>
      </div>
    </div>
  );
}
