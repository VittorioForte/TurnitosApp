import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import api from '../utils/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
  });

  const [deletingServiceId, setDeletingServiceId] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.filter(s => s.active));
    } catch (error) {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/${editingService.service_id}`, formData);
        toast.success('Servicio actualizado');
      } else {
        await api.post('/services', formData);
        toast.success('Servicio creado');
      }
      setDialogOpen(false);
      resetForm();
      loadServices();
    } catch (error) {
      toast.error('Error al guardar servicio');
    }
  };

  const handleDelete = async (serviceId) => {
    setDeletingServiceId(serviceId);
  };

  const confirmDelete = async () => {
    if (!deletingServiceId) return;
    
    try {
      await api.delete(`/services/${deletingServiceId}`);
      toast.success('Servicio desactivado');
      setDeletingServiceId(null);
      await loadServices();
    } catch (error) {
      console.error('Error al desactivar servicio:', error);
      const message = error.response?.data?.detail || 'Error al desactivar servicio';
      toast.error(message);
      setDeletingServiceId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 30,
      price: 0,
    });
    setEditingService(null);
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price: service.price,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div data-testid="loading-services">Cargando...</div>;
  }

  return (
    <div data-testid="services-page" className="max-w-7xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" data-testid="services-title">SERVICIOS</h1>
          <p className="text-zinc-600">Gestiona los servicios de tu negocio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-service-button"
              className="bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Plus size={20} className="mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="service-dialog" className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="service-name-input"
                  className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  data-testid="service-description-input"
                  className="focus:ring-[#FFD60A] focus:border-[#FFD60A] min-h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duración (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    required
                    data-testid="service-duration-input"
                    className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    data-testid="service-price-input"
                    className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                  />
                </div>
              </div>
              <Button
                type="submit"
                data-testid="service-submit-button"
                className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                {editingService ? 'Actualizar' : 'Crear'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card data-testid="empty-services-message" className="border-2 border-zinc-200">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-600">No tienes servicios creados aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.service_id}
              className="border-2 border-zinc-200 hover:border-[#FFD60A] transition-colors"
              data-testid={`service-card-${service.service_id}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start gap-2">
                  <span className="flex-1 break-words" data-testid={`service-name-${service.service_id}`}>{service.name}</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditDialog(service)}
                      data-testid={`edit-service-${service.service_id}`}
                      className="text-zinc-600 hover:text-zinc-900 p-1"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.service_id)}
                      data-testid={`delete-service-${service.service_id}`}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 mb-4 line-clamp-2" data-testid={`service-description-${service.service_id}`}>
                  {service.description}
                </p>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-100">
                  <span className="text-zinc-600">
                    <strong data-testid={`service-duration-${service.service_id}`}>{service.duration_minutes} min</strong>
                  </span>
                  <span className="text-[#FFD60A] font-bold text-lg" data-testid={`service-price-${service.service_id}`}>
                    ${service.price}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deletingServiceId} onOpenChange={(open) => !open && setDeletingServiceId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Desactivar servicio?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Este servicio dejará de mostrarse en la página pública. Los turnos existentes no se afectarán.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingServiceId(null)}
                className="border-zinc-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700"
                data-testid="confirm-delete-service"
              >
                Desactivar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;