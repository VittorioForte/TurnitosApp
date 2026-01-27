import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import api from '../utils/api';

const Subscription = () => {
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
    
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status === 'success') {
      toast.success('¡Pago procesado! Tu suscripción se activará en breve.');
      window.history.replaceState({}, '', '/subscription');
      setTimeout(() => loadSubscriptionStatus(), 3000);
    } else if (status === 'failure') {
      toast.error('El pago no pudo ser procesado. Intenta nuevamente.');
      window.history.replaceState({}, '', '/subscription');
    } else if (status === 'pending') {
      toast.info('Pago pendiente de confirmación.');
      window.history.replaceState({}, '', '/subscription');
    }
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await api.get('/subscription/status');
      setSubStatus(response.data);
    } catch (error) {
      toast.error('Error al cargar estado de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    setProcessingPayment(true);
    try {
      const response = await api.post('/subscription/create-payment');
      window.location.href = response.data.init_point;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear link de pago');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <div data-testid="loading-subscription">Cargando...</div>;
  }

  return (
    <div data-testid="subscription-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="subscription-title">SUSCRIPCIÓN</h1>
        <p className="text-zinc-600">Gestiona tu suscripción a Turnitos</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="border-2 border-zinc-200" data-testid="subscription-status-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {subStatus?.subscription_active ? (
                <CheckCircle2 className="text-green-600" size={24} />
              ) : (
                <AlertCircle className="text-yellow-600" size={24} />
              )}
              Estado de Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subStatus?.subscription_active ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold" data-testid="subscription-active-message">
                    Tu suscripción está activa
                  </p>
                  {subStatus.subscription_ends && (
                    <p className="text-sm text-green-700 mt-1">
                      Vence el: {new Date(subStatus.subscription_ends).toLocaleDateString('es-AR')}
                    </p>
                  )}
                  {subStatus.subscription_days_left !== undefined && (
                    <p className="text-sm text-green-700 mt-1">
                      Días restantes: {subStatus.subscription_days_left}
                    </p>
                  )}
                </div>
                {subStatus.show_renewal_warning && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-semibold">
                      ¡Tu suscripción vence en {subStatus.subscription_days_left} días!
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Renueva ahora para no perder acceso al sistema.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold" data-testid="trial-status-message">
                    Estás en período de prueba gratuita
                  </p>
                  <p className="text-sm text-yellow-700 mt-1" data-testid="trial-days-remaining">
                    Días restantes: {subStatus?.trial_days_left}
                  </p>
                </div>
                {subStatus?.trial_days_left <= 3 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm" data-testid="trial-expiring-warning">
                      Tu prueba gratuita está por vencer. Activa tu suscripción para continuar usando Turnitos.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FFD60A]">
          <CardHeader>
            <CardTitle>Plan Mensual</CardTitle>
            <CardDescription>Acceso completo a todas las funciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${subStatus?.subscription_price || 11999}</span>
              <span className="text-zinc-600">/mes</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Turnos ilimitados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Servicios ilimitados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Link público de reservas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Notificaciones por email
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Soporte prioritario
              </li>
            </ul>
            {!subStatus?.subscription_active && (
              <Button
                onClick={handleActivateSubscription}
                disabled={processingPayment}
                data-testid="activate-subscription-button"
                className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <CreditCard size={20} className="mr-2" />
                {processingPayment ? 'Redirigiendo...' : 'Pagar con MercadoPago'}
                <ExternalLink size={16} className="ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-zinc-200">
          <CardHeader>
            <CardTitle>Información de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 mb-3">
              Los pagos se procesan de forma segura a través de MercadoPago.
              Tu información está protegida y nunca se almacena en nuestros servidores.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <CheckCircle2 size={14} className="text-green-600" />
              <span>Pago único mensual - Sin renovación automática</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
              <CheckCircle2 size={14} className="text-green-600" />
              <span>Activación instantánea tras confirmación de pago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;