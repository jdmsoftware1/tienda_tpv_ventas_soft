import { useState, useEffect } from 'react';
import { Plus, Stethoscope, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface BajaMedica {
  id: string;
  empleado: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  diagnostico: string;
  observaciones: string;
  documento_justificativo: string;
  created_at: string;
}

interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
}

const TIPOS_BAJA: Record<string, string> = {
  enfermedad_comun: 'Enfermedad Común',
  accidente_laboral: 'Accidente Laboral',
  accidente_no_laboral: 'Accidente No Laboral',
  maternidad: 'Maternidad',
  paternidad: 'Paternidad',
  riesgo_embarazo: 'Riesgo Embarazo',
  otros: 'Otros',
};

export default function BajasMedicas() {
  const { user } = useAuthStore();
  const [bajas, setBajas] = useState<BajaMedica[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo: 'enfermedad_comun',
    diagnostico: '',
    observaciones: '',
  });

  useEffect(() => {
    loadBajas();
    if (user?.role === 'admin') {
      loadEmpleados();
    }
  }, [user]);

  const loadBajas = async () => {
    try {
      const response = await api.get('/bajas-medicas');
      setBajas(response.data);
    } catch (error) {
      toast.error('Error al cargar bajas médicas');
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
      await api.post('/bajas-medicas', formData);
      toast.success('Baja médica registrada correctamente');
      setShowModal(false);
      setFormData({
        empleadoId: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo: 'enfermedad_comun',
        diagnostico: '',
        observaciones: '',
      });
      loadBajas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar baja');
    }
  };

  const getBajaActiva = (baja: BajaMedica): boolean => {
    const hoy = new Date();
    const inicio = new Date(baja.fecha_inicio);
    const fin = new Date(baja.fecha_fin);
    return hoy >= inicio && hoy <= fin;
  };

  const calcularDuracion = (inicio: string, fin: string): number => {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const diff = fechaFin.getTime() - fechaInicio.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Bajas Médicas</h1>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Registrar Baja
          </button>
        )}
      </div>

      {/* Lista de Bajas */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnóstico
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bajas.map((baja) => {
                const activa = getBajaActiva(baja);
                return (
                  <tr key={baja.id} className={activa ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {baja.empleado.nombre} {baja.empleado.apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {TIPOS_BAJA[baja.tipo]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(baja.fecha_inicio).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(baja.fecha_fin).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calcularDuracion(baja.fecha_inicio, baja.fecha_fin)} días
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activa ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Activa
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Finalizada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {baja.diagnostico || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {bajas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay bajas médicas registradas
          </div>
        )}
      </div>

      {/* Modal Registrar Baja */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Registrar Baja Médica</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado *
                  </label>
                  <select
                    required
                    value={formData.empleadoId}
                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar empleado</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
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

                <div>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Baja *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Object.entries(TIPOS_BAJA).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico
                  </label>
                  <textarea
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="Diagnóstico médico"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="Observaciones adicionales"
                  />
                </div>
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
                  Registrar Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
