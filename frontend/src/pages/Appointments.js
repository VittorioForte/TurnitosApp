import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import api from '../utils/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    service_id: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apptRes, servRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/services'),
      ]);
      setAppointments(apptRes.data);
      setServices(servRes.data.filter(s => s.active));
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments/admin', formData);
      toast.success('Turno creado');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear turno');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('¿Cancelar este turno?')) return;
    try {
      await api.delete(`/appointments/${appointmentId}`);
      toast.success('Turno cancelado');
      loadData();
    } catch (error) {
      toast.error('Error al cancelar turno');
    }
  };

  const resetForm = () => {
    setFormData({
      service_id: '',
      client_name: '',
      client_phone: '',
      client_email: '',
      date: '',
      time: '',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      <Badge className={variants[status] || variants.pending} data-testid={`status-badge-${status}`}>
        {status === 'pending' ? 'Pendiente' : status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
      </Badge>
    );
  };

  if (loading) {
    return <div data-testid="loading-appointments">Cargando...</div>;
  }

  return (
    <div data-testid="appointments-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="appointments-title">TURNOS</h1>
          <p className="text-zinc-600">Gestiona los turnos de tus clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-appointment-button"
              className="bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black"
            >
              <Plus size={20} className="mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="appointment-dialog">
            <DialogHeader>
              <DialogTitle>Crear Turno Manualmente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="service">Servicio</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  required
                >
                  <SelectTrigger data-testid="service-select">
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.service_id} value={service.service_id}>
                        {service.name} - ${service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="client_name">Nombre del Cliente</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  data-testid="client-name-input"
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Teléfono</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  required
                  data-testid="client-phone-input"
                />
              </div>
              <div>
                <Label htmlFor="client_email">Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  required
                  data-testid="client-email-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    data-testid="appointment-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    data-testid="appointment-time-input"
                  />
                </div>
              </div>
              <Button
                type="submit"
                data-testid="appointment-submit-button"
                className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black"
              >
                Crear Turno
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {appointments.length === 0 ? (
        <Card data-testid="empty-appointments-message">
          <CardContent className="py-12 text-center">
            <CalendarIcon size={48} className="mx-auto text-zinc-400 mb-4" />
            <p className="text-zinc-600">No hay turnos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card
              key={appt.appointment_id}
              className="border-2 border-zinc-200"
              data-testid={`appointment-card-${appt.appointment_id}`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold" data-testid={`appointment-client-${appt.appointment_id}`}>
                        {appt.client_name}
                      </h3>
                      {getStatusBadge(appt.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-zinc-600">
                      <p data-testid={`appointment-service-${appt.appointment_id}`}>
                        <strong>Servicio:</strong> {appt.service_name}
                      </p>
                      <p data-testid={`appointment-phone-${appt.appointment_id}`}>
                        <strong>Teléfono:</strong> {appt.client_phone}
                      </p>
                      <p data-testid={`appointment-date-${appt.appointment_id}`}>
                        <strong>Fecha:</strong> {appt.date}
                      </p>
                      <p data-testid={`appointment-time-${appt.appointment_id}`}>
                        <strong>Hora:</strong> {appt.time}
                      </p>
                      <p data-testid={`appointment-email-${appt.appointment_id}`}>
                        <strong>Email:</strong> {appt.client_email}
                      </p>
                    </div>
                  </div>
                  {appt.status !== 'cancelled' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancel(appt.appointment_id)}
                      data-testid={`cancel-appointment-${appt.appointment_id}`}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;