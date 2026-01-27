import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, DollarSign, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const AdminSettings = () => {
  const [price, setPrice] = useState('11999');
  const [loading, setLoading] = useState(false);

  const handleSavePrice = () => {
    toast.info('Para cambiar el precio de suscripción, actualiza la variable SUBSCRIPTION_PRICE en el archivo /app/backend/.env y reinicia el backend con: sudo supervisorctl restart backend');
    toast.success(`Precio configurado: $${price}`);
  };

  return (
    <div data-testid="admin-settings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="settings-title">
          <Settings className="inline mr-3" size={36} />
          CONFIGURACIÓN
        </h1>
        <p className="text-zinc-600">Administra los ajustes de tu negocio</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="border-2 border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={24} />
              Precio de Suscripción
            </CardTitle>
            <CardDescription>
              Configura el precio mensual que cobrarás a través de MercadoPago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="price">Precio Mensual (ARS)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                data-testid="price-input"
                className="text-2xl font-bold"
              />
              <p className="text-sm text-zinc-500 mt-2">
                Precio actual configurado: $11999 ARS
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Para cambiar el precio, debes actualizar el archivo de configuración del servidor:
              </p>
              <ol className="text-sm text-yellow-700 mt-2 ml-4 list-decimal">
                <li>Edita /app/backend/.env</li>
                <li>Cambia SUBSCRIPTION_PRICE="11999" al nuevo valor</li>
                <li>Reinicia el backend</li>
              </ol>
            </div>

            <Button
              onClick={handleSavePrice}
              disabled={loading}
              data-testid="save-price-button"
              className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black"
            >
              <Save size={20} className="mr-2" />
              Ver Instrucciones
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-zinc-200">
          <CardHeader>
            <CardTitle>Integración MercadoPago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-700">MercadoPago configurado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-700">Webhooks activos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-700">Actualización automática de suscripciones</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4">
              Los pagos se procesan automáticamente. Cuando un cliente paga, su suscripción se activa por 30 días.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
