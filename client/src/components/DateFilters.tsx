import { Calendar, X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';

interface CierreMes {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas: number;
  total_pagos: number;
  total_devoluciones: number;
  cerrado: boolean;
}

interface DateFiltersProps {
  filterType: string;
  setFilterType: (type: string) => void;
  fechaInicio: string;
  setFechaInicio: (fecha: string) => void;
  fechaFin: string;
  setFechaFin: (fecha: string) => void;
  onClear: () => void;
  showCierres?: boolean;
}

export default function DateFilters({
  filterType,
  setFilterType,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  onClear,
  showCierres = true,
}: DateFiltersProps) {
  const [cierres, setCierres] = useState<CierreMes[]>([]);
  const [showCierresDropdown, setShowCierresDropdown] = useState(false);

  useEffect(() => {
    if (showCierres) {
      api.get('/cierre-mes')
        .then(res => setCierres(res.data))
        .catch(err => console.error('Error al cargar cierres:', err));
    }
  }, [showCierres]);

  const handleCierreSelect = (cierre: CierreMes) => {
    setFilterType(`cierre-${cierre.id}`);
    setFechaInicio(cierre.fecha_inicio.split('T')[0]);
    setFechaFin(cierre.fecha_fin.split('T')[0]);
    setShowCierresDropdown(false);
  };

  const formatCierreName = (cierre: CierreMes) => {
    const inicio = new Date(cierre.fecha_inicio);
    const fin = new Date(cierre.fecha_fin);
    return `${inicio.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} - ${fin.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
  };

  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
    const now = new Date();
    
    switch (type) {
      case 'hoy':
        const todayStr = now.toISOString().split('T')[0];
        setFechaInicio(todayStr);
        setFechaFin(todayStr);
        break;
      case 'semana':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Lunes
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Domingo
        setFechaInicio(weekStart.toISOString().split('T')[0]);
        setFechaFin(weekEnd.toISOString().split('T')[0]);
        break;
      case 'mes':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setFechaInicio(monthStart.toISOString().split('T')[0]);
        setFechaFin(monthEnd.toISOString().split('T')[0]);
        break;
      case 'año':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        setFechaInicio(yearStart.toISOString().split('T')[0]);
        setFechaFin(yearEnd.toISOString().split('T')[0]);
        break;
      case 'personalizado':
        // No cambiar fechas, el usuario las seleccionará
        break;
      default:
        setFechaInicio('');
        setFechaFin('');
    }
  };

  const hasFilters = filterType !== '' || fechaInicio || fechaFin;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Calendar size={18} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filtrar:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterTypeChange('hoy')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterType === 'hoy' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => handleFilterTypeChange('semana')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterType === 'semana' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => handleFilterTypeChange('mes')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterType === 'mes' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Este Mes
        </button>
        <button
          onClick={() => handleFilterTypeChange('año')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterType === 'año' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Este Año
        </button>
        <button
          onClick={() => handleFilterTypeChange('personalizado')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterType === 'personalizado' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Personalizado
        </button>

        {/* Botón Cierres de Mes */}
        {showCierres && cierres.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowCierresDropdown(!showCierresDropdown)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterType.startsWith('cierre-') 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <FileText size={14} />
              Cierres
            </button>
            
            {showCierresDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                {cierres.map((cierre) => (
                  <button
                    key={cierre.id}
                    onClick={() => handleCierreSelect(cierre)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 border-b border-gray-100 last:border-b-0 ${
                      filterType === `cierre-${cierre.id}` ? 'bg-purple-100' : ''
                    }`}
                  >
                    <div className="font-medium">{formatCierreName(cierre)}</div>
                    <div className="text-xs text-gray-500">
                      Ventas: €{Number(cierre.total_ventas).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {filterType === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
          Limpiar
        </button>
      )}
    </div>
  );
}
