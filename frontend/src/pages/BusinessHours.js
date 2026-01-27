import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Clock, Calendar, Trash2 } from 'lucide-react';
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
  const [closedDates, setClosedDates] = useState([]);
  const [newClosedDate, setNewClosedDate] = useState('');

  useEffect(() => {
    loadHours();
    loadClosedDates();
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

  const loadClosedDates = async () => {
    try {
      const response = await api.get('/closed-dates');
      setClosedDates(response.data || []);
    } catch (error) {
      // Endpoint opcional, no mostrar error
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

  const handleAddClosedDate = async () => {
    if (!newClosedDate) return;
    try {
      await api.post('/closed-dates', { date: newClosedDate });
      toast.success('Día cerrado agregado');
      setNewClosedDate('');
      loadClosedDates();
    } catch (error) {
      toast.error('Error al agregar día cerrado');
    }
  };

  const handleRemoveClosedDate = async (date) => {
    try {
      await api.delete(`/closed-dates/${date}`);
      toast.success('Día cerrado eliminado');
      loadClosedDates();
    } catch (error) {
      toast.error('Error al eliminar día cerrado');
    }
  };

  if (loading) {
    return <div data-testid="loading-hours">Cargando...</div>;
  }

  return (
    <div data-testid="business-hours-page" className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" data-testid="hours-title">HORARIOS</h1>
        <p className="text-zinc-600">Configura tus días y horarios de atención</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-2 border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={24} />
                Horario Semanal
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-20 sm:w-24">
                          <Label className="text-base sm:text-lg font-bold" data-testid={`day-name-${day.id}`}>
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
                          <span className={`text-xs sm:text-sm font-semibold uppercase tracking-wide ${
                            dayHours.is_open ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dayHours.is_open ? '✓ Abierto' : '✗ Cerrado'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {dayHours.is_open && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 pt-3 border-t border-zinc-200">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-zinc-600 w-16 sm:w-20">Apertura:</Label>
                          <Input
                            type="time"
                            value={dayHours.open_time || '09:00'}
                            onChange={(e) => handleTimeChange(day.id, 'open_time', e.target.value)}
                            data-testid={`open-time-${day.id}`}
                            className="w-28 sm:w-32 focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                          />
                        </div>
                        <span className="hidden sm:inline text-zinc-400">—</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-zinc-600 w-16 sm:w-20">Cierre:</Label>
                          <Input
                            type="time"
                            value={dayHours.close_time || '18:00'}
                            onChange={(e) => handleTimeChange(day.id, 'close_time', e.target.value)}
                            data-testid={`close-time-${day.id}`}
                            className="w-28 sm:w-32 focus:ring-[#FFD60A] focus:border-[#FFD60A]"
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
        </div>

        <div>
          <Card className="border-2 border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={24} />
                Días Cerrados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Cerrar día específico (feriados, etc.)</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={newClosedDate}
                    onChange={(e) => setNewClosedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                  />
                  <Button
                    onClick={handleAddClosedDate}
                    className="bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold"
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {closedDates.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay días cerrados</p>
                ) : (
                  closedDates.map((item) => (
                    <div
                      key={item.date}
                      className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <span className="text-sm font-medium">
                        {new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      <button
                        onClick={() => handleRemoveClosedDate(item.date)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-zinc-200 mt-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Consejo</h3>
                  <p className="text-xs text-zinc-600">
                    Los horarios semanales se aplican todas las semanas. Los días cerrados específicos tienen prioridad y bloquean reservas para esas fechas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BusinessHours;