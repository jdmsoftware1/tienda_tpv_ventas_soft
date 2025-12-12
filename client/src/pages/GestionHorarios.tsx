import { useState, useEffect } from 'react';
import { Save, Calendar, Copy, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
}

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
}

interface Horario {
  dia_semana: string;
  hora_entrada_manana: string;
  hora_salida_manana: string;
  hora_entrada_tarde: string;
  hora_salida_tarde: string;
  es_dia_libre: boolean;
  turno_corrido?: boolean;
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

export default function GestionHorarios() {
  const { user } = useAuthStore();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaHoraria[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [selectedPlantilla, setSelectedPlantilla] = useState('');
  const [horarios, setHorarios] = useState<Record<string, Horario>>({});
  
  // Selector de semana
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [numeroSemana, setNumeroSemana] = useState(getWeekNumber(new Date()));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    loadEmpleados();
    loadPlantillas();
  }, []);

  useEffect(() => {
    if (selectedEmpleado && anio && numeroSemana) {
      loadHorarioSemana();
    } else {
      initializeHorarios();
    }
  }, [selectedEmpleado, anio, numeroSemana]);

  useEffect(() => {
    calcularFechasSemana();
  }, [anio, numeroSemana]);

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  function calcularFechasSemana() {
    const simple = new Date(anio, 0, 1 + (numeroSemana - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const inicio = new Date(ISOweekStart);
    const fin = new Date(ISOweekStart);
    fin.setDate(fin.getDate() + 6);
    
    setFechaInicio(inicio.toLocaleDateString('es-ES'));
    setFechaFin(fin.toLocaleDateString('es-ES'));
  }

  const initializeHorarios = () => {
    const defaultHorarios: Record<string, Horario> = {};
    DIAS_SEMANA.forEach(dia => {
      defaultHorarios[dia] = {
        dia_semana: dia,
        hora_entrada_manana: '09:00',
        hora_salida_manana: '14:00',
        hora_entrada_tarde: '16:00',
        hora_salida_tarde: '20:00',
        es_dia_libre: dia === 'domingo',
        turno_corrido: false,
      };
    });
    setHorarios(defaultHorarios);
  };

  const loadEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      toast.error('Error al cargar empleados');
    }
  };

  const loadPlantillas = async () => {
    try {
      const response = await api.get('/plantillas-horarias');
      setPlantillas(response.data);
    } catch (error) {
      toast.error('Error al cargar plantillas');
    }
  };

  const loadHorarioSemana = async () => {
    try {
      const response = await api.get(`/horarios/empleado/${selectedEmpleado}/semana/${anio}/${numeroSemana}`);
      if (response.data && response.data.horarios_semana) {
        const horariosMap: Record<string, Horario> = {};
        response.data.horarios_semana.forEach((h: any) => {
          horariosMap[h.dia_semana] = {
            ...h,
            turno_corrido: !h.hora_entrada_tarde && !h.hora_salida_tarde && !h.es_dia_libre,
          };
        });
        setHorarios(horariosMap);
        if (response.data.plantilla_horaria_id) {
          setSelectedPlantilla(response.data.plantilla_horaria_id);
        }
      } else {
        initializeHorarios();
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        initializeHorarios();
      } else {
        toast.error('Error al cargar horario');
      }
    }
  };

  const aplicarPlantilla = () => {
    const plantilla = plantillas.find(p => p.id === selectedPlantilla);
    if (!plantilla) return;

    const horariosMap: Record<string, Horario> = {};
    plantilla.horarios.forEach(h => {
      horariosMap[h.dia_semana] = {
        ...h,
        turno_corrido: !h.hora_entrada_tarde && !h.hora_salida_tarde && !h.es_dia_libre,
      };
    });
    setHorarios(horariosMap);
    toast.success('Plantilla aplicada correctamente');
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

  const copiarSemana = async () => {
    if (!selectedEmpleado) {
      toast.error('Selecciona un empleado');
      return;
    }

    const semanaOrigen = prompt('¿De qué semana quieres copiar? (número de semana)');
    if (!semanaOrigen) return;

    try {
      await api.post(`/horarios/empleado/${selectedEmpleado}/copiar`, {
        anio_origen: anio,
        semana_origen: parseInt(semanaOrigen),
        anio_destino: anio,
        semana_destino: numeroSemana,
      });
      toast.success('Horario copiado correctamente');
      loadHorarioSemana();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al copiar horario');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmpleado) {
      toast.error('Selecciona un empleado');
      return;
    }

    try {
      const horariosArray = Object.values(horarios).map(h => ({
        dia_semana: h.dia_semana,
        hora_entrada_manana: h.turno_corrido || !h.es_dia_libre ? h.hora_entrada_manana : undefined,
        hora_salida_manana: h.turno_corrido || !h.es_dia_libre ? h.hora_salida_manana : undefined,
        hora_entrada_tarde: !h.turno_corrido && !h.es_dia_libre ? h.hora_entrada_tarde : undefined,
        hora_salida_tarde: !h.turno_corrido && !h.es_dia_libre ? h.hora_salida_tarde : undefined,
        es_dia_libre: h.es_dia_libre,
      }));

      await api.post(`/horarios/empleado/${selectedEmpleado}/semana`, {
        anio,
        numero_semana: numeroSemana,
        horarios: horariosArray,
        plantilla_horaria_id: selectedPlantilla || undefined,
      });

      toast.success('Horario guardado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar horario');
    }
  };

  const cambiarSemana = (delta: number) => {
    let nuevaSemana = numeroSemana + delta;
    let nuevoAnio = anio;

    if (nuevaSemana < 1) {
      nuevoAnio--;
      nuevaSemana = 52;
    } else if (nuevaSemana > 52) {
      nuevoAnio++;
      nuevaSemana = 1;
    }

    setAnio(nuevoAnio);
    setNumeroSemana(nuevaSemana);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Solo los administradores pueden gestionar horarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Horarios Semanales</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Empleado y Plantilla */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empleado *
              </label>
              <select
                required
                value={selectedEmpleado}
                onChange={(e) => setSelectedEmpleado(e.target.value)}
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
                Plantilla Horaria (Opcional)
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedPlantilla}
                  onChange={(e) => setSelectedPlantilla(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sin plantilla</option>
                  {plantillas.map((plantilla) => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={aplicarPlantilla}
                  disabled={!selectedPlantilla}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FileText size={18} />
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Semana */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Semana</h3>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => cambiarSemana(-1)}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-primary-600">
                Semana {numeroSemana} - {anio}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {fechaInicio} - {fechaFin}
              </div>
            </div>

            <button
              type="button"
              onClick={() => cambiarSemana(1)}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>

            <button
              type="button"
              onClick={copiarSemana}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Copy size={18} />
              Copiar de otra semana
            </button>
          </div>
        </div>

        {/* Configuración de Horarios */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurar Horario</h3>
          <div className="space-y-4">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{DIAS_LABELS[dia]}</h4>
                  <div className="flex items-center gap-3">
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
                        disabled={horarios[dia]?.es_dia_libre}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Turno Corrido</span>
                    </label>
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
                        />
                        <input
                          type="time"
                          value={horarios[dia]?.hora_salida_manana || ''}
                          onChange={(e) => handleHorarioChange(dia, 'hora_salida_manana', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
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
                          />
                          <input
                            type="time"
                            value={horarios[dia]?.hora_salida_tarde || ''}
                            onChange={(e) => handleHorarioChange(dia, 'hora_salida_tarde', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save size={20} />
            Guardar Horario
          </button>
        </div>
      </form>
    </div>
  );
}
