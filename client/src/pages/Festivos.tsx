import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Festivo {
  id: string;
  fecha: string;
  nombre: string;
  tipo: 'nacional' | 'autonomico' | 'local';
  descripcion: string | null;
  created_at: string;
}

const TIPOS_FESTIVO = [
  { value: 'nacional', label: 'Nacional', color: 'bg-red-100 text-red-800' },
  { value: 'autonomico', label: 'Autonómico', color: 'bg-blue-100 text-blue-800' },
  { value: 'local', label: 'Local', color: 'bg-green-100 text-green-800' },
];

export default function Festivos() {
  const { user } = useAuthStore();
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    fecha: '',
    nombre: '',
    tipo: 'nacional' as 'nacional' | 'autonomico' | 'local',
    descripcion: '',
  });

  useEffect(() => {
    loadFestivos();
  }, [selectedYear]);

  const loadFestivos = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/festivos?year=${selectedYear}`);
      setFestivos(response.data);
    } catch (error) {
      toast.error('Error al cargar festivos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.role !== 'admin') {
      toast.error('Solo los administradores pueden crear festivos');
      return;
    }

    try {
      await api.post('/festivos', formData);
      toast.success('Festivo creado correctamente');
      setShowModal(false);
      setFormData({ fecha: '', nombre: '', tipo: 'nacional', descripcion: '' });
      loadFestivos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear festivo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este festivo?')) return;

    try {
      await api.delete(`/festivos/${id}`);
      toast.success('Festivo eliminado');
      loadFestivos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar festivo');
    }
  };

  const getTipoConfig = (tipo: string) => {
    return TIPOS_FESTIVO.find(t => t.value === tipo) || TIPOS_FESTIVO[0];
  };

  const groupByMonth = (festivos: Festivo[]) => {
    const grouped: Record<number, Festivo[]> = {};
    festivos.forEach(festivo => {
      const month = new Date(festivo.fecha).getMonth();
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(festivo);
    });
    return grouped;
  };

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const festivosPorMes = groupByMonth(festivos);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Festivos</h1>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              Nuevo Festivo
            </button>
          )}
        </div>
      </div>

      {/* Lista de Festivos por Mes */}
      <div className="space-y-6">
        {Object.keys(festivosPorMes).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No hay festivos registrados para {selectedYear}
          </div>
        ) : (
          Object.keys(festivosPorMes)
            .map(Number)
            .sort((a, b) => a - b)
            .map(month => (
              <div key={month} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-primary-50 px-6 py-3 border-b border-primary-100">
                  <h2 className="text-lg font-semibold text-primary-900">{MESES[month]}</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {festivosPorMes[month].map(festivo => {
                      const tipoConfig = getTipoConfig(festivo.tipo);
                      return (
                        <div
                          key={festivo.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {new Date(festivo.fecha).getDate()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {MESES[new Date(festivo.fecha).getMonth()].substring(0, 3)}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{festivo.nombre}</h3>
                              {festivo.descripcion && (
                                <p className="text-sm text-gray-600">{festivo.descripcion}</p>
                              )}
                              <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${tipoConfig.color}`}>
                                {tipoConfig.label}
                              </span>
                            </div>
                          </div>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(festivo.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Modal Crear Festivo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Festivo</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Año Nuevo"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {TIPOS_FESTIVO.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
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
                  placeholder="Descripción opcional"
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
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los festivos son inmutables y se utilizan automáticamente para calcular
          los días laborables en las solicitudes de vacaciones.
        </p>
      </div>
    </div>
  );
}
