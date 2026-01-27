import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Clock } from 'lucide-react';
import api from '../utils/api';

const DAYS = [
  { id: 0, name: 'Lunes', short: 'Lun' },
  { id: 1, name: 'Martes', short: 'Mar' },
  { id: 2, name: 'Miércoles', short: 'Mié' },
  { id: 3, name: 'Jueves', short: 'Jue' },
  { id: 4, name: 'Viernes', short: 'Vie' },
  { id: 5, name: 'Sábado', short: 'Sáb' },
  { id: 6, name: 'Domingo', short: 'Dom' },
];

const BusinessHours = () => {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const response = await api.get('/business-hours');
      setHours(response.data);
    } catch (error) {
      toast.error('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (dayId, isOpen) => {
    setHours(hours.map(h => 
      h.day_of_week === dayId 
        ? { ...h, is_open: isOpen, open_time: isOpen ? '09:00' : null, close_time: isOpen ? '18:00' : null }
        : h
    ));
  };

  const handleTimeChange = (dayId, field, value) => {
    setHours(hours.map(h => 
      h.day_of_week === dayId ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    try {
      await api.put('/business-hours', hours);
      toast.success('Horarios actualizados');
    } catch (error) {
      toast.error('Error al actualizar horarios');
    }
  };

  if (loading) {
    return <div data-testid="loading-hours">Cargando...</div>;
  }

  return (
    <div data-testid="business-hours-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="hours-title">HORARIOS</h1>
        <p className="text-zinc-600">Configura tus días y horarios de atención</p>
      </div>

      <Card className="border-2 border-zinc-200 max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} />
            Horario de Atención
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const dayHours = hours.find(h => h.day_of_week === day.id);
            if (!dayHours) return null;

            return (
              <div
                key={day.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  dayHours.is_open 
                    ? 'border-[#FFD60A] bg-[#FFD60A]/5' 
                    : 'border-zinc-200 bg-zinc-50'
                }`}
                data-testid={`day-row-${day.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Label className="text-lg font-bold" data-testid={`day-name-${day.id}`}>
                        {day.name}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dayHours.is_open}
                        onCheckedChange={(checked) => handleToggle(day.id, checked)}
                        data-testid={`day-toggle-${day.id}`}
                        className="data-[state=checked]:bg-[#FFD60A]"
                      />
                      <span className={`text-sm font-semibold uppercase tracking-wide ${
                        dayHours.is_open ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dayHours.is_open ? '✓ Abierto' : '✗ Cerrado'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {dayHours.is_open && (
                  <div className="flex items-center gap-3 ml-28 pt-3 border-t border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-zinc-600 w-20">Apertura:</Label>
                      <Input
                        type="time"
                        value={dayHours.open_time || '09:00'}
                        onChange={(e) => handleTimeChange(day.id, 'open_time', e.target.value)}
                        data-testid={`open-time-${day.id}`}
                        className="w-32 focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                      />
                    </div>
                    <span className="text-zinc-400">—</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-zinc-600 w-20">Cierre:</Label>
                      <Input
                        type="time"
                        value={dayHours.close_time || '18:00'}
                        onChange={(e) => handleTimeChange(day.id, 'close_time', e.target.value)}
                        data-testid={`close-time-${day.id}`}
                        className="w-32 focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4">
            <Button
              onClick={handleSave}
              data-testid="save-hours-button"
              className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Guardar Horarios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-zinc-200 max-w-3xl mt-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-bold text-sm mb-1">Consejo</h3>
              <p className="text-sm text-zinc-600">
                Los horarios que configures aquí determinarán los slots disponibles para que tus clientes 
                reserven turnos en la página pública. Los turnos se generan cada 30 minutos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessHours;