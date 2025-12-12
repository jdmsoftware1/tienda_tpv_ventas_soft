import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Palmtree, Stethoscope, User } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface HorarioSemana {
  id: string;
  anio: number;
  numero_semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  horarios_semana: {
    dia_semana: string;
    hora_entrada_manana: string | null;
    hora_salida_manana: string | null;
    hora_entrada_tarde: string | null;
    hora_salida_tarde: string | null;
    es_dia_libre: boolean;
    horas_dia: number;
  }[];
  horas_totales_semana: number;
}

interface Vacacion {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  motivo: string;
}

interface BajaMedica {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  diagnostico: string;
}

interface Festivo {
  id: string;
  fecha: string;
  nombre: string;
  tipo: string;
}

interface DiaCalendario {
  fecha: Date;
  esDelMes: boolean;
  horario?: {
    entrada_manana: string | null;
    salida_manana: string | null;
    entrada_tarde: string | null;
    salida_tarde: string | null;
    es_dia_libre: boolean;
  };
  vacacion?: Vacacion;
  baja?: BajaMedica;
  festivo?: Festivo;
}

const DIAS_SEMANA_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIA_SEMANA_MAP: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
  0: 'domingo',
};

interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
}

export default function CalendarioPersonal() {
  const { user } = useAuthStore();
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [horarios, setHorarios] = useState<HorarioSemana[]>([]);
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [bajas, setBajas] = useState<BajaMedica[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');

  useEffect(() => {
    if (user) {
      // Inicializar empleado seleccionado
      if (!selectedEmpleadoId) {
        setSelectedEmpleadoId(user.id);
      }
      if (user.role === 'admin') {
        loadEmpleados();
      }
    }
  }, [user]);

  useEffect(() => {
    if (selectedEmpleadoId) {
      loadDatos();
    }
  }, [selectedEmpleadoId, mesActual, anioActual]);

  useEffect(() => {
    generarCalendario();
  }, [horarios, vacaciones, bajas, festivos, mesActual, anioActual]);

  const loadEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      toast.error('Error al cargar empleados');
    }
  };

  const loadDatos = async () => {
    if (!selectedEmpleadoId) return;
    
    try {
      const [horariosRes, vacacionesRes, bajasRes, festivosRes] = await Promise.all([
        api.get(`/horarios/empleado/${selectedEmpleadoId}?anio=${anioActual}`),
        api.get(`/vacaciones/empleado/${selectedEmpleadoId}`),
        api.get(`/bajas-medicas/empleado/${selectedEmpleadoId}`),
        api.get('/festivos'),
      ]);

      setHorarios(horariosRes.data);
      setVacaciones(vacacionesRes.data);
      setBajas(bajasRes.data);
      setFestivos(festivosRes.data);
    } catch (error) {
      toast.error('Error al cargar datos del calendario');
    }
  };

  const generarCalendario = () => {
    const primerDia = new Date(anioActual, mesActual, 1);
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    
    // Ajustar para que la semana empiece en lunes
    let diaSemanaInicio = primerDia.getDay();
    diaSemanaInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;

    const dias: DiaCalendario[] = [];

    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(anioActual, mesActual, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const fecha = new Date(anioActual, mesActual - 1, ultimoDiaMesAnterior - i);
      dias.push({
        fecha,
        esDelMes: false,
      });
    }

    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(anioActual, mesActual, dia);
      const diaData: DiaCalendario = {
        fecha,
        esDelMes: true,
      };

      // Buscar horario
      const horario = obtenerHorarioDia(fecha);
      if (horario) {
        diaData.horario = horario;
      }

      // Buscar vacación
      const vacacion = vacaciones.find(v => 
        estaEnRango(fecha, new Date(v.fecha_inicio), new Date(v.fecha_fin))
      );
      if (vacacion) {
        diaData.vacacion = vacacion;
      }

      // Buscar baja médica
      const baja = bajas.find(b => 
        estaEnRango(fecha, new Date(b.fecha_inicio), new Date(b.fecha_fin))
      );
      if (baja) {
        diaData.baja = baja;
      }

      // Buscar festivo
      const festivo = festivos.find(f => 
        new Date(f.fecha).toDateString() === fecha.toDateString()
      );
      if (festivo) {
        diaData.festivo = festivo;
      }

      dias.push(diaData);
    }

    // Días del mes siguiente
    const diasRestantes = 42 - dias.length; // 6 semanas completas
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(anioActual, mesActual + 1, dia);
      dias.push({
        fecha,
        esDelMes: false,
      });
    }

    setDiasCalendario(dias);
  };

  const obtenerHorarioDia = (fecha: Date) => {
    const numeroSemana = getWeekNumber(fecha);
    const horarioSemana = horarios.find(
      h => h.anio === fecha.getFullYear() && h.numero_semana === numeroSemana
    );

    if (!horarioSemana) return null;

    const diaSemana = DIA_SEMANA_MAP[fecha.getDay()];
    const horarioDia = horarioSemana.horarios_semana.find(
      h => h.dia_semana === diaSemana
    );

    if (!horarioDia) return null;

    return {
      entrada_manana: horarioDia.hora_entrada_manana,
      salida_manana: horarioDia.hora_salida_manana,
      entrada_tarde: horarioDia.hora_entrada_tarde,
      salida_tarde: horarioDia.hora_salida_tarde,
      es_dia_libre: horarioDia.es_dia_libre,
    };
  };

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const estaEnRango = (fecha: Date, inicio: Date, fin: Date): boolean => {
    const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const i = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const fn = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
    return f >= i && f <= fn;
  };

  const cambiarMes = (delta: number) => {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio--;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio++;
    }

    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  const esHoy = (fecha: Date): boolean => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Mi Calendario</h1>
      </div>

      {/* Filtro de empleado (solo admin) */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Ver calendario de:</label>
            <select
              value={selectedEmpleadoId}
              onChange={(e) => setSelectedEmpleadoId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellidos}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navegación del mes */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => cambiarMes(-1)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
          >
            <ChevronLeft size={24} />
          </button>

          <h2 className="text-2xl font-bold text-gray-900">
            {MESES[mesActual]} {anioActual}
          </h2>

          <button
            onClick={() => cambiarMes(1)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Horario Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Vacaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Baja Médica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Festivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Día Libre</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Cabecera días de la semana */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {DIAS_SEMANA_LABELS.map((dia) => (
            <div key={dia} className="p-3 text-center font-semibold text-gray-700 text-sm">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7">
          {diasCalendario.map((dia, index) => {
            let bgColor = 'bg-white';
            let borderColor = 'border-gray-200';

            if (!dia.esDelMes) {
              bgColor = 'bg-gray-50';
            } else if (dia.baja) {
              bgColor = 'bg-red-50';
              borderColor = 'border-red-200';
            } else if (dia.vacacion) {
              bgColor = 'bg-green-50';
              borderColor = 'border-green-200';
            } else if (dia.festivo) {
              bgColor = 'bg-purple-50';
              borderColor = 'border-purple-200';
            } else if (dia.horario?.es_dia_libre) {
              bgColor = 'bg-gray-100';
            } else if (dia.horario) {
              bgColor = 'bg-blue-50';
              borderColor = 'border-blue-200';
            }

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border ${borderColor} ${bgColor} ${
                  !dia.esDelMes ? 'opacity-50' : ''
                } ${esHoy(dia.fecha) ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-sm font-semibold ${
                      esHoy(dia.fecha)
                        ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : dia.esDelMes
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {dia.fecha.getDate()}
                  </span>
                </div>

                <div className="space-y-1">
                  {dia.festivo && (
                    <div className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded flex items-center gap-1">
                      <Calendar size={10} />
                      <span className="truncate">{dia.festivo.nombre}</span>
                    </div>
                  )}

                  {dia.baja && (
                    <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded flex items-center gap-1">
                      <Stethoscope size={10} />
                      <span>Baja médica</span>
                    </div>
                  )}

                  {dia.vacacion && (
                    <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded flex items-center gap-1">
                      <Palmtree size={10} />
                      <span>Vacaciones</span>
                    </div>
                  )}

                  {!dia.baja && !dia.vacacion && dia.horario && !dia.horario.es_dia_libre && (
                    <div className="text-xs space-y-0.5">
                      {dia.horario.entrada_manana && dia.horario.salida_manana && (
                        <div className="flex items-center gap-1 text-blue-700">
                          <Clock size={10} />
                          <span>
                            {dia.horario.entrada_manana}-{dia.horario.salida_manana}
                          </span>
                        </div>
                      )}
                      {dia.horario.entrada_tarde && dia.horario.salida_tarde && (
                        <div className="flex items-center gap-1 text-orange-700">
                          <Clock size={10} />
                          <span>
                            {dia.horario.entrada_tarde}-{dia.horario.salida_tarde}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {!dia.baja && !dia.vacacion && dia.horario?.es_dia_libre && (
                    <div className="text-xs text-gray-600 italic">Día libre</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
