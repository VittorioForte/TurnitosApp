import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api from '../utils/api';

const DAYS = [
  { id: 0, name: 'Lunes' },
  { id: 1, name: 'Martes' },
  { id: 2, name: 'Miércoles' },
  { id: 3, name: 'Jueves' },
  { id: 4, name: 'Viernes' },
  { id: 5, name: 'Sábado' },
  { id: 6, name: 'Domingo' },
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

      <Card className="border-2 border-zinc-200 max-w-2xl">
        <CardHeader>
          <CardTitle>Horario de Atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayHours = hours.find(h => h.day_of_week === day.id);
            if (!dayHours) return null;

            return (
              <div
                key={day.id}
                className="flex items-center gap-4 p-4 border border-zinc-200 rounded-lg"
                data-testid={`day-row-${day.id}`}
              >
                <div className="w-32">
                  <Label className="font-bold" data-testid={`day-name-${day.id}`}>{day.name}</Label>
                </div>
                <Switch
                  checked={dayHours.is_open}
                  onCheckedChange={(checked) => handleToggle(day.id, checked)}
                  data-testid={`day-toggle-${day.id}`}
                />
                {dayHours.is_open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayHours.open_time || '09:00'}
                      onChange={(e) => handleTimeChange(day.id, 'open_time', e.target.value)}
                      data-testid={`open-time-${day.id}`}
                      className="w-32"
                    />
                    <span className="text-zinc-600">a</span>
                    <Input
                      type="time"
                      value={dayHours.close_time || '18:00'}
                      onChange={(e) => handleTimeChange(day.id, 'close_time', e.target.value)}
                      data-testid={`close-time-${day.id}`}
                      className="w-32"
                    />
                  </div>
                ) : (
                  <span className="text-zinc-500 text-sm" data-testid={`closed-label-${day.id}`}>Cerrado</span>
                )}
              </div>
            );
          })}

          <Button
            onClick={handleSave}
            data-testid="save-hours-button"
            className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black"
          >
            Guardar Horarios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessHours;