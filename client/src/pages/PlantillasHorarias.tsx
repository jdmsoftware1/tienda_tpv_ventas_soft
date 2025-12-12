import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, X, FileText, Copy } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface PlantillaHoraria {
  id: string;
  nombre: string;
  descripcion: string;
  horarios: {
    dia_semana: string;
    hora_entrada_manana: string;
    hora_salida_manana: string;
    hora_entrada_tarde: string;
    hora_salida_tarde: string;
    es_dia_libre: boolean;
  }[];
  created_at: string;
}

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export default function PlantillasHorarias() {
  const { user } = useAuthStore();
  const [plantillas, setPlantillas] = useState<PlantillaHoraria[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [horarios, setHorarios] = useState<Record<string, any>>({});

  useEffect(() => {
    loadPlantillas();
    initializeHorarios();
  }, []);

  const initializeHorarios = () => {
    const defaultHorarios: Record<string, any> = {};
    DIAS_SEMANA.forEach(dia => {
      defaultHorarios[dia] = {
        dia_semana: dia,
        hora_entrada_manana: '09:00',
        hora_salida_manana: '14:00',
        hora_entrada_tarde: '16:00',
        hora_salida_tarde: '20:00',
        es_dia_libre: dia === 'domingo',
      };
    });
    setHorarios(defaultHorarios);
  };

  const loadPlantillas = async () => {
    try {
      const response = await api.get('/plantillas-horarias');
      setPlantillas(response.data);
    } catch (error) {
      toast.error('Error al cargar plantillas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const horariosArray = Object.values(horarios);
      await api.post('/plantillas-horarias', {
        ...formData,
        horarios: horariosArray,
      });
      toast.success('Plantilla creada correctamente');
      setShowModal(false);
      setFormData({ nombre: '', descripcion: '' });
      initializeHorarios();
      loadPlantillas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear plantilla');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      await api.delete(`/plantillas-horarias/${id}`);
      toast.success('Plantilla eliminada');
      loadPlantillas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleHorarioChange = (dia: string, field: string, value: string | boolean) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [field]: value,
      },
    }));
  };

  const copiarHorario = (diaOrigen: string, diasDestino: string[]) => {
    const horarioOrigen = horarios[diaOrigen];
    if (!horarioOrigen) return;

    setHorarios(prev => {
      const updated = { ...prev };
      diasDestino.forEach(diaDestino => {
        updated[diaDestino] = { ...horarioOrigen, dia_semana: diaDestino };
      });
      return updated;
    });
    toast.success(`Horario copiado a ${diasDestino.length} día(s)`);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Solo los administradores pueden gestionar plantillas horarias.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Plantillas Horarias</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Plantilla
        </button>
      </div>

      {/* Lista de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plantillas.map(plantilla => (
          <div key={plantilla.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-primary-50 p-4 border-b border-primary-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{plantilla.nombre}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plantilla.descripcion}</p>
                </div>
                <button
                  onClick={() => handleDelete(plantilla.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2 text-sm">
                {plantilla.horarios.map(h => (
                  <div key={h.dia_semana} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{DIAS_LABELS[h.dia_semana]}:</span>
                    {h.es_dia_libre ? (
                      <span className="text-gray-500">Día libre</span>
                    ) : (
                      <span className="text-gray-600">
                        {h.hora_entrada_manana}-{h.hora_salida_manana} / {h.hora_entrada_tarde}-{h.hora_salida_tarde}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {plantillas.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          No hay plantillas horarias creadas
        </div>
      )}

      {/* Modal Crear Plantilla */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nueva Plantilla Horaria</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Turno Mañana, Jornada Partida"
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
                  rows={2}
                  placeholder="Descripción opcional"
                />
              </div>

              {/* Configuración de Horarios */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurar Horario Semanal</h3>
                <div className="space-y-4">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{DIAS_LABELS[dia]}</h4>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const diasRestantes = DIAS_SEMANA.filter(d => d !== dia);
                              const selected = diasRestantes.filter((_, i) => window.confirm(`¿Copiar a ${DIAS_LABELS[diasRestantes[i]]}?`));
                              if (selected.length > 0) copiarHorario(dia, selected);
                            }}
                            className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800"
                            title="Copiar este horario a otros días"
                          >
                            <Copy size={14} />
                            Copiar
                          </button>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={horarios[dia]?.es_dia_libre || false}
                              onChange={(e) => handleHorarioChange(dia, 'es_dia_libre', e.target.checked)}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Día Libre</span>
                          </label>
                        </div>
                      </div>

                      {!horarios[dia]?.es_dia_libre && (
                        <div>
                          <div className="mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={horarios[dia]?.turno_corrido || false}
                                onChange={(e) => {
                                  handleHorarioChange(dia, 'turno_corrido', e.target.checked);
                                  if (e.target.checked) {
                                    handleHorarioChange(dia, 'hora_entrada_tarde', '');
                                    handleHorarioChange(dia, 'hora_salida_tarde', '');
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Turno Corrido (sin descanso)</span>
                            </label>
                          </div>
                          <div className={`grid ${horarios[dia]?.turno_corrido ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h5 className="text-xs font-semibold text-blue-900 mb-2">
                                {horarios[dia]?.turno_corrido ? 'Horario' : 'Turno Mañana'}
                              </h5>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  value={horarios[dia]?.hora_entrada_manana || ''}
                                  onChange={(e) => handleHorarioChange(dia, 'hora_entrada_manana', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                                  placeholder="Entrada"
                                />
                                <input
                                  type="time"
                                  value={horarios[dia]?.hora_salida_manana || ''}
                                  onChange={(e) => handleHorarioChange(dia, 'hora_salida_manana', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                                  placeholder="Salida"
                                />
                              </div>
                            </div>
                            {!horarios[dia]?.turno_corrido && (
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <h5 className="text-xs font-semibold text-orange-900 mb-2">Turno Tarde</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="time"
                                    value={horarios[dia]?.hora_entrada_tarde || ''}
                                    onChange={(e) => handleHorarioChange(dia, 'hora_entrada_tarde', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                                    placeholder="Entrada"
                                  />
                                  <input
                                    type="time"
                                    value={horarios[dia]?.hora_salida_tarde || ''}
                                    onChange={(e) => handleHorarioChange(dia, 'hora_salida_tarde', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                                    placeholder="Salida"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save size={18} />
                  Crear Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
