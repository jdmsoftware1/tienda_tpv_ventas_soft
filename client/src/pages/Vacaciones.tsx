import { useState, useEffect } from 'react';
import { Plus, Calendar, Check, X, User } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Vacacion {
  id: string;
  empleado: {
    id: string;
    nombre: string;
    id_empleado: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  motivo: string | null;
  observaciones_admin: string | null;
  aprobado_por: any;
  fecha_aprobacion: string | null;
  created_at: string;
}

interface Empleado {
  id: string;
  nombre: string;
  id_empleado: string;
  dias_vacaciones_disponibles: number;
}

export default function Vacaciones() {
  const { user } = useAuthStore();
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedVacacion, setSelectedVacacion] = useState<Vacacion | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: '',
  });

  useEffect(() => {
    loadVacaciones();
    loadEmpleados();
  }, []);

  const loadVacaciones = async () => {
    try {
      const response = user?.role === 'admin'
        ? await api.get('/vacaciones')
        : await api.get(`/vacaciones/empleado/${user?.id}`);
      setVacaciones(response.data);
    } catch (error) {
      toast.error('Error al cargar vacaciones');
    }
  };

  const loadEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      toast.error('Error al cargar empleados');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/vacaciones/solicitar', formData);
      toast.success('Solicitud de vacaciones enviada');
      setShowModal(false);
      setFormData({ empleadoId: '', fecha_inicio: '', fecha_fin: '', motivo: '' });
      loadVacaciones();
      loadEmpleados();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar vacaciones');
    }
  };

  const handleAprobar = async () => {
    if (!selectedVacacion) return;

    try {
      await api.patch(`/vacaciones/${selectedVacacion.id}/aprobar`, { observaciones });
      toast.success('Vacaciones aprobadas');
      setShowApprovalModal(false);
      setSelectedVacacion(null);
      setObservaciones('');
      loadVacaciones();
      loadEmpleados();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al aprobar');
    }
  };

  const handleRechazar = async () => {
    if (!selectedVacacion) return;

    if (!observaciones.trim()) {
      toast.error('Debes indicar el motivo del rechazo');
      return;
    }

    try {
      await api.patch(`/vacaciones/${selectedVacacion.id}/rechazar`, { observaciones });
      toast.success('Vacaciones rechazadas');
      setShowApprovalModal(false);
      setSelectedVacacion(null);
      setObservaciones('');
      loadVacaciones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al rechazar');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      case 'cancelada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  const pendientes = vacaciones.filter(v => v.estado === 'pendiente');
  const historial = vacaciones.filter(v => v.estado !== 'pendiente');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Vacaciones</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Solicitar Vacaciones
        </button>
      </div>

      {/* Días Disponibles */}
      {user?.role !== 'admin' && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Días Disponibles</p>
              <p className="text-4xl font-bold">
                {empleados.find(e => e.id === user?.id)?.dias_vacaciones_disponibles || 0}
              </p>
            </div>
            <Calendar className="w-16 h-16 text-primary-200" />
          </div>
        </div>
      )}

      {/* Solicitudes Pendientes */}
      {pendientes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes Pendientes</h2>
          <div className="space-y-3">
            {pendientes.map(vacacion => (
              <div
                key={vacacion.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">{vacacion.empleado.nombre}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(vacacion.estado)}`}>
                        {getEstadoLabel(vacacion.estado)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Desde:</span>
                        <span className="ml-2 font-medium">{new Date(vacacion.fecha_inicio).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Hasta:</span>
                        <span className="ml-2 font-medium">{new Date(vacacion.fecha_fin).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Días:</span>
                        <span className="ml-2 font-medium">{vacacion.dias_solicitados} días laborables</span>
                      </div>
                    </div>
                    {vacacion.motivo && (
                      <p className="mt-2 text-sm text-gray-700">
                        <strong>Motivo:</strong> {vacacion.motivo}
                      </p>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedVacacion(vacacion);
                          setShowApprovalModal(true);
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Gestionar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial</h2>
        {historial.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No hay vacaciones en el historial
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Días
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial.map(vacacion => (
                  <tr key={vacacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vacacion.empleado.nombre}</div>
                      <div className="text-sm text-gray-500">{vacacion.empleado.id_empleado}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(vacacion.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(vacacion.fecha_fin).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vacacion.dias_solicitados}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(vacacion.estado)}`}>
                        {getEstadoLabel(vacacion.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {vacacion.observaciones_admin || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Solicitar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Solicitar Vacaciones</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado *
                </label>
                <select
                  required
                  value={formData.empleadoId}
                  onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecciona empleado</option>
                  {empleados.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} - {emp.dias_vacaciones_disponibles} días disponibles
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Motivo opcional"
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
                  Solicitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aprobar/Rechazar */}
      {showApprovalModal && selectedVacacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Gestionar Solicitud</h2>
              <button onClick={() => setShowApprovalModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Empleado:</p>
                <p className="font-semibold text-gray-900">{selectedVacacion.empleado.nombre}</p>
                <p className="text-sm text-gray-600 mt-2">Período:</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedVacacion.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(selectedVacacion.fecha_fin).toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm text-gray-600 mt-2">Días solicitados:</p>
                <p className="font-semibold text-gray-900">{selectedVacacion.dias_solicitados} días laborables</p>
                {selectedVacacion.motivo && (
                  <>
                    <p className="text-sm text-gray-600 mt-2">Motivo:</p>
                    <p className="text-gray-900">{selectedVacacion.motivo}</p>
                  </>
                )}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Observaciones (requeridas para rechazar)"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRechazar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X size={18} />
                Rechazar
              </button>
              <button
                onClick={handleAprobar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={18} />
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
