import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Calendar, Scissors, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publicSlug, setPublicSlug] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadStats();
    loadPublicSlug();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadPublicSlug = async () => {
    try {
      const response = await api.get('/user/custom-slug');
      setPublicSlug(response.data.custom_slug || user.user_id);
    } catch (error) {
      setPublicSlug(user.user_id);
    }
  };

  const getPublicUrl = () => {
    return `${window.location.origin}/book/${publicSlug}`;
  };

  const statCards = [
    {
      title: 'Turnos Totales',
      value: stats?.total_appointments || 0,
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      title: 'Turnos Pendientes',
      value: stats?.pending_appointments || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Servicios Activos',
      value: stats?.total_services || 0,
      icon: Scissors,
      color: 'text-green-600',
    },
    {
      title: 'Días de Prueba',
      value: stats?.trial_days_left || 0,
      icon: Users,
      color: 'text-[#FFD60A]',
    },
  ];

  if (loading) {
    return <div data-testid="loading-dashboard">Cargando...</div>;
  }

  return (
    <div data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="dashboard-title">
          DASHBOARD
        </h1>
        <p className="text-zinc-600">Bienvenido, {user.business_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-2 border-zinc-200 hover:border-zinc-300 transition-colors"
              data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s/g, '-')}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-600">
                  {stat.title}
                </CardTitle>
                <Icon className={stat.color} size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid={`stat-value-${stat.title.toLowerCase().replace(/\s/g, '-')}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-zinc-200">
          <CardHeader>
            <CardTitle>Link Público de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 mb-4">
              Comparte este link con tus clientes para que reserven turnos:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/book/${user.user_id}`}
                data-testid="public-booking-link"
                className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm bg-zinc-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${user.user_id}`);
                  toast.success('Link copiado');
                }}
                data-testid="copy-link-button"
                className="px-4 py-2 bg-[#FFD60A] text-black font-bold rounded-md hover:bg-[#EAB308] border border-black hard-shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                Copiar
              </button>
            </div>
          </CardContent>
        </Card>

        {stats?.show_renewal_warning && (
          <Card className="border-2 border-red-400 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">¡Suscripción Por Vencer!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-4">
                Tu suscripción vence en {stats.subscription_days_left} días. 
                Renueva ahora para no perder acceso al sistema.
              </p>
              <button
                onClick={() => window.location.href = '/subscription'}
                data-testid="renew-subscription-button"
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 border border-red-800"
              >
                Renovar Ahora
              </button>
            </CardContent>
          </Card>
        )}

        {stats?.trial_days_left <= 3 && !stats?.subscription_active && (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Prueba Gratis Próxima a Vencer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-700 mb-4">
                Te quedan {stats.trial_days_left} días de prueba gratuita.
              </p>
              <button
                onClick={() => window.location.href = '/subscription'}
                data-testid="activate-subscription-button"
                className="px-4 py-2 bg-[#FFD60A] text-black font-bold rounded-md hover:bg-[#EAB308] border border-black"
              >
                Activar Suscripción
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;