import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import DateFilters from '../components/DateFilters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Stats {
  periodo: { inicio: Date; fin: Date };
  total_ventas: number;
  total_pagos: number;
  total_devoluciones: number;
  cantidad_ventas: number;
  cantidad_pagos: number;
  cantidad_devoluciones: number;
}

interface Cliente {
  id: string;
  nombre: string;
  balance?: number;
  compras?: { total: number }[];
  pagos?: { monto: number }[];
  devoluciones?: { monto: number }[];
}

interface Articulo {
  id: string;
  nombre: string;
  cantidad: number;
  precio_venta: number;
}

interface Compra {
  id: string;
  total: number;
  created_at: string;
  cliente?: { id: string; nombre: string; empleado_id?: string };
}

interface Empleado {
  id: string;
  id_empleado: string;
  nombre: string;
}

interface Pago {
  id: string;
  monto: number;
  created_at: string;
  cliente?: { id: string; empleado_id?: string };
}

interface Devolucion {
  id: string;
  monto: number;
  created_at: string;
  cliente?: { id: string; empleado_id?: string };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [, setStats] = useState<Stats | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filterType, setFilterType] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filterEmpleadoId, setFilterEmpleadoId] = useState('');

  // Inicializar filtro de mes actual
  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFechaInicio(monthStart.toISOString().split('T')[0]);
    setFechaFin(monthEnd.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, clientesRes, articulosRes, comprasRes, pagosRes, devolucionesRes, empleadosRes] = await Promise.all([
          api.get('/cierre-mes/current-month'),
          api.get('/clientes'),
          api.get('/articulos'),
          api.get('/compras'),
          api.get('/pagos'),
          api.get('/devoluciones'),
          api.get('/empleados'),
        ]);
        
        setStats(statsRes.data);
        setClientes(clientesRes.data);
        setArticulos(articulosRes.data);
        setCompras(comprasRes.data);
        setPagos(pagosRes.data);
        setDevoluciones(devolucionesRes.data);
        setEmpleados(empleadosRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función para filtrar por fecha
  const filterByDate = <T extends { created_at: string }>(items: T[]): T[] => {
    if (!fechaInicio && !fechaFin) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      itemDate.setHours(0, 0, 0, 0);
      
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        if (itemDate < inicio) return false;
      }
      
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        if (itemDate > fin) return false;
      }
      
      return true;
    });
  };

  // Función para filtrar por empleado
  const filterByEmpleado = <T extends { cliente?: { empleado_id?: string } }>(items: T[]): T[] => {
    if (!filterEmpleadoId) return items;
    return items.filter(item => item.cliente?.empleado_id === filterEmpleadoId);
  };

  // Limpiar filtros
  const clearDateFilters = () => {
    setFilterType('');
    setFechaInicio('');
    setFechaFin('');
  };

  // Datos filtrados
  const filteredCompras = filterByEmpleado(filterByDate(compras));
  const filteredPagos = filterByEmpleado(filterByDate(pagos));
  const filteredDevoluciones = filterByEmpleado(filterByDate(devoluciones));
  const comprasRecientes = filteredCompras.slice(0, 5);

  // Calcular estadísticas filtradas
  const filteredStats = {
    total_ventas: filteredCompras.reduce((sum, c) => sum + Number(c.total), 0),
    total_pagos: filteredPagos.reduce((sum, p) => sum + Number(p.monto), 0),
    total_devoluciones: filteredDevoluciones.reduce((sum, d) => sum + Number(d.monto), 0),
    cantidad_ventas: filteredCompras.length,
    cantidad_pagos: filteredPagos.length,
    cantidad_devoluciones: filteredDevoluciones.length,
  };

  // Calcular balance de clientes
  const clientesConBalance = clientes.map(cliente => {
    const totalCompras = cliente.compras?.reduce((sum, c) => sum + Number(c.total), 0) || 0;
    const totalPagos = cliente.pagos?.reduce((sum, p) => sum + Number(p.monto), 0) || 0;
    const totalDevoluciones = cliente.devoluciones?.reduce((sum, d) => sum + Number(d.monto), 0) || 0;
    return {
      ...cliente,
      balance: totalCompras - totalPagos - totalDevoluciones,
    };
  });

  // Top 5 clientes con mayor deuda
  const topDeudores = [...clientesConBalance]
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // Artículos con bajo stock (menos de 10 unidades)
  const articulosBajoStock = articulos
    .filter(a => a.cantidad < 10)
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 5);

  // Datos para gráfico de barras (distribución de transacciones)
  const transaccionesData = [
    { name: 'Ventas', valor: filteredStats.cantidad_ventas, monto: filteredStats.total_ventas },
    { name: 'Pagos', valor: filteredStats.cantidad_pagos, monto: filteredStats.total_pagos },
    { name: 'Devoluciones', valor: filteredStats.cantidad_devoluciones, monto: filteredStats.total_devoluciones },
  ];

  // Datos para gráfico circular
  const pieData = [
    { name: 'Ventas', value: filteredStats.total_ventas },
    { name: 'Pagos', value: filteredStats.total_pagos },
    { name: 'Devoluciones', value: filteredStats.total_devoluciones },
  ].filter(d => d.value > 0);

  const balance = filteredStats.total_ventas - filteredStats.total_pagos - filteredStats.total_devoluciones;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const cards = [
    {
      title: 'Ventas',
      value: formatCurrency(filteredStats.total_ventas),
      count: filteredStats.cantidad_ventas,
      icon: ShoppingCart,
      color: 'bg-primary-500',
      trend: 'up',
    },
    {
      title: 'Pagos Recibidos',
      value: formatCurrency(filteredStats.total_pagos),
      count: filteredStats.cantidad_pagos,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: 'up',
    },
    {
      title: 'Devoluciones',
      value: formatCurrency(filteredStats.total_devoluciones),
      count: filteredStats.cantidad_devoluciones,
      icon: Package,
      color: 'bg-orange-500',
      trend: 'down',
    },
    {
      title: 'Balance Pendiente',
      value: formatCurrency(balance),
      count: clientes.length,
      icon: balance >= 0 ? TrendingUp : TrendingDown,
      color: balance >= 0 ? 'bg-purple-500' : 'bg-red-500',
      trend: balance >= 0 ? 'up' : 'down',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, <span className="font-medium">{user?.nombre}</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>{format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
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
            <strong>{filteredCompras.length}</strong> compras, <strong>{filteredPagos.length}</strong> pagos, <strong>{filteredDevoluciones.length}</strong> devoluciones
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.trend === 'up' ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  <span>{card.count}</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Transacciones
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transaccionesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'monto' ? formatCurrency(value) : value,
                    name === 'monto' ? 'Monto' : 'Cantidad'
                  ]}
                />
                <Legend />
                <Bar dataKey="valor" name="Cantidad" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="monto" name="Monto (€)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Montos
          </h2>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos para mostrar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Deudores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Deudores
            </h2>
            <a href="/clientes" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </a>
          </div>
          {topDeudores.length > 0 ? (
            <div className="space-y-3">
              {topDeudores.map((cliente, index) => (
                <div key={cliente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900 truncate max-w-[120px]">
                      {cliente.nombre}
                    </span>
                  </div>
                  <span className="text-red-600 font-semibold">
                    {formatCurrency(cliente.balance)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay deudas pendientes</p>
            </div>
          )}
        </div>

        {/* Artículos Bajo Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Bajo
            </h2>
            <a href="/articulos" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </a>
          </div>
          {articulosBajoStock.length > 0 ? (
            <div className="space-y-3">
              {articulosBajoStock.map((articulo) => (
                <div key={articulo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      articulo.cantidad === 0 ? 'text-red-500' : 'text-orange-500'
                    }`} />
                    <span className="font-medium text-gray-900 truncate max-w-[120px]">
                      {articulo.nombre}
                    </span>
                  </div>
                  <span className={`font-semibold ${
                    articulo.cantidad === 0 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {articulo.cantidad} uds
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Stock en niveles óptimos</p>
            </div>
          )}
        </div>

        {/* Compras Recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Compras Recientes
            </h2>
            <a href="/compras" className="text-sm text-primary-600 hover:underline">
              Ver todas
            </a>
          </div>
          {comprasRecientes.length > 0 ? (
            <div className="space-y-3">
              {comprasRecientes.map((compra) => (
                <div key={compra.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-[140px]">
                      {compra.cliente?.nombre || 'Cliente'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(compra.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <span className="text-primary-600 font-semibold">
                    {formatCurrency(Number(compra.total))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay compras recientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <a
            href="/clientes"
            className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">Clientes</p>
          </a>
          <a
            href="/compras"
            className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">Compras</p>
          </a>
          <a
            href="/pagos"
            className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">Pagos</p>
          </a>
          <a
            href="/articulos"
            className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">Artículos</p>
          </a>
          <a
            href="/empleados"
            className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">Empleados</p>
          </a>
          <a
            href="/devoluciones"
            className="p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
          >
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600" />
            <p className="font-medium text-gray-700 group-hover:text-primary-600">Devoluciones</p>
          </a>
        </div>
      </div>
    </div>
  );
}
