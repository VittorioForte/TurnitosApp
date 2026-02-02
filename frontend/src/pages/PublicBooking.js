import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PublicBooking = () => {
  const { userId } = useParams();
  const [businessInfo, setBusinessInfo] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadBusinessInfo();
  }, [userId]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const loadBusinessInfo = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/${userId}/info`);
      setBusinessInfo(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.detail || 'Este negocio no está disponible');
      } else {
        toast.error('No se pudo cargar la información del negocio');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/public/${userId}/available-slots`, {
        params: {
          service_id: selectedService.service_id,
          date: selectedDate,
        },
      });
      setAvailableSlots(response.data.slots);
      setSelectedTime('');
    } catch (error) {
      toast.error('Error al cargar horarios disponibles');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/public/${userId}/appointments`, {
        service_id: selectedService.service_id,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        date: selectedDate,
        time: selectedTime,
      });
      setBookingSuccess(true);
      toast.success('¡Turno reservado exitosamente!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al reservar turno');
    }
  };

  const resetBooking = () => {
    setBookingSuccess(false);
    setSelectedService(null);
    setSelectedDate('');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setClientEmail('');
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50" data-testid="loading-public-booking">
        <p className="text-zinc-600">Cargando...</p>
      </div>
    );
  }

  if (!businessInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4" data-testid="business-not-found">
        <Card className="max-w-md border-2 border-red-400">
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-2xl font-bold text-red-600">Negocio No Disponible</h2>
            <p className="text-zinc-600">
              Este negocio no está activo en este momento. Si eres el dueño, por favor renueva tu suscripción.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4" data-testid="booking-success">
        <Card className="max-w-md w-full border-2 border-green-500 hard-shadow">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 size={64} className="mx-auto text-green-600" />
            <h2 className="text-2xl font-bold">¡Turno Reservado!</h2>
            <div className="text-left bg-zinc-100 p-4 rounded-lg space-y-2">
              <p><strong>Servicio:</strong> {selectedService.name}</p>
              <p><strong>Fecha:</strong> {selectedDate}</p>
              <p><strong>Hora:</strong> {selectedTime}</p>
              <p><strong>Cliente:</strong> {clientName}</p>
            </div>
            <p className="text-sm text-zinc-600">
              Te enviamos un email de confirmación a {clientEmail}
            </p>
            <Button
              onClick={resetBooking}
              data-testid="book-another-button"
              className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase"
            >
              Reservar Otro Turno
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50" data-testid="public-booking-page">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl border-x border-zinc-100">
        {/* Header */}
        <div className="bg-[#FFD60A] p-6 border-b-4 border-black">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight" data-testid="business-name-header">
            {businessInfo.business_name}
          </h1>
          <p className="text-sm text-black/70 mt-1">Reserva tu turno online</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select Service */}
          <div data-testid="service-selection-section">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-[#FFD60A] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              Selecciona un Servicio
            </h2>
            <div className="space-y-3">
              {businessInfo.services.map((service) => (
                <Card
                  key={service.service_id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedService?.service_id === service.service_id
                      ? 'border-[#FFD60A] bg-[#FFD60A]/10'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  onClick={() => setSelectedService(service)}
                  data-testid={`service-option-${service.service_id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold" data-testid={`service-name-${service.service_id}`}>
                          {service.name}
                        </h3>
                        <p className="text-sm text-zinc-600 mt-1" data-testid={`service-description-${service.service_id}`}>
                          {service.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm text-zinc-600">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {service.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1 text-[#FFD60A] font-bold">
                            <DollarSign size={14} />
                            ${service.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 2: Select Date */}
          {selectedService && (
            <div data-testid="date-selection-section">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-[#FFD60A] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Selecciona una Fecha
              </h2>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                data-testid="date-input"
                className="w-full focus:ring-[#FFD60A] focus:border-[#FFD60A]"
              />
            </div>
          )}

          {/* Step 3: Select Time */}
          {selectedService && selectedDate && (
            <div data-testid="time-selection-section">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-[#FFD60A] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Selecciona un Horario
              </h2>
              {availableSlots.length === 0 ? (
                <p className="text-zinc-600 text-sm" data-testid="no-slots-message">
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      data-testid={`time-slot-${slot}`}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedTime === slot
                          ? 'border-[#FFD60A] bg-[#FFD60A] text-black'
                          : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Client Info */}
          {selectedService && selectedDate && selectedTime && (
            <form onSubmit={handleBooking} data-testid="client-info-form">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-[#FFD60A] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                Tus Datos
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    data-testid="client-name-input"
                    placeholder="Juan Pérez"
                    className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                    data-testid="client-phone-input"
                    placeholder="+54 11 1234-5678"
                    className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                    data-testid="client-email-input"
                    placeholder="tu@email.com"
                    className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="confirm-booking-button"
                  className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase py-6 text-lg hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Confirmar Reserva
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
