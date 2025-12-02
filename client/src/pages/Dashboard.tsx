import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { TrendingUp, Users, Package, ShoppingCart } from 'lucide-react';

interface Stats {
  periodo: { inicio: Date; fin: Date };
  total_ventas: number;
  total_pagos: number;
  total_devoluciones: number;
  cantidad_ventas: number;
  cantidad_pagos: number;
  cantidad_devoluciones: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/cierre-mes/current-month')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: 'Ventas del Mes',
      value: stats ? `$${stats.total_ventas.toFixed(2)}` : '$0.00',
      count: stats?.cantidad_ventas || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Pagos Recibidos',
      value: stats ? `$${stats.total_pagos.toFixed(2)}` : '$0.00',
      count: stats?.cantidad_pagos || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Devoluciones',
      value: stats ? `$${stats.total_devoluciones.toFixed(2)}` : '$0.00',
      count: stats?.cantidad_devoluciones || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'Balance Neto',
      value: stats
        ? `$${(stats.total_ventas - stats.total_pagos - stats.total_devoluciones).toFixed(2)}`
        : '$0.00',
      count: 0,
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido, {user?.nombre} ({user?.role})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.count > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {card.count} transacciones
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/clientes"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium text-gray-900">Clientes</p>
          </a>
          <a
            href="/compras"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
          >
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium text-gray-900">Nueva Compra</p>
          </a>
          <a
            href="/pagos"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium text-gray-900">Registrar Pago</p>
          </a>
          <a
            href="/articulos"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
          >
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="font-medium text-gray-900">Artículos</p>
          </a>
        </div>
      </div>
    </div>
  );
}
