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
  ArrowDownRight
} from 'lucide-react';
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
  cliente?: { nombre: string };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [comprasRecientes, setComprasRecientes] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, clientesRes, articulosRes, comprasRes] = await Promise.all([
          api.get('/cierre-mes/current-month'),
          api.get('/clientes'),
          api.get('/articulos'),
          api.get('/compras'),
        ]);
        
        setStats(statsRes.data);
        setClientes(clientesRes.data);
        setArticulos(articulosRes.data);
        setComprasRecientes(comprasRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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
    { name: 'Ventas', valor: stats?.cantidad_ventas || 0, monto: stats?.total_ventas || 0 },
    { name: 'Pagos', valor: stats?.cantidad_pagos || 0, monto: stats?.total_pagos || 0 },
    { name: 'Devoluciones', valor: stats?.cantidad_devoluciones || 0, monto: stats?.total_devoluciones || 0 },
  ];

  // Datos para gráfico circular
  const pieData = [
    { name: 'Ventas', value: stats?.total_ventas || 0 },
    { name: 'Pagos', value: stats?.total_pagos || 0 },
    { name: 'Devoluciones', value: stats?.total_devoluciones || 0 },
  ].filter(d => d.value > 0);

  const balance = stats 
    ? stats.total_ventas - stats.total_pagos - stats.total_devoluciones 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const cards = [
    {
      title: 'Ventas del Mes',
      value: formatCurrency(stats?.total_ventas || 0),
      count: stats?.cantidad_ventas || 0,
      icon: ShoppingCart,
      color: 'bg-primary-500',
      trend: 'up',
    },
    {
      title: 'Pagos Recibidos',
      value: formatCurrency(stats?.total_pagos || 0),
      count: stats?.cantidad_pagos || 0,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: 'up',
    },
    {
      title: 'Devoluciones',
      value: formatCurrency(stats?.total_devoluciones || 0),
      count: stats?.cantidad_devoluciones || 0,
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
