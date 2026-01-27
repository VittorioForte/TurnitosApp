import React, { useState } from 'react';
import { toast } from 'sonner';
import { Bug, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../utils/api';

const ReportBug = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    description: '',
    url: window.location.href
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await api.post('/report-bug', formData);
      toast.success('¡Reporte enviado! Gracias por ayudarnos a mejorar.');
      setFormData({
        name: '',
        email: '',
        category: '',
        subject: '',
        description: '',
        url: window.location.href
      });
    } catch (error) {
      toast.error('Error al enviar el reporte. Inténtalo nuevamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="report-bug-page" className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" data-testid="report-bug-title">
          <Bug size={36} />
          REPORTAR ERROR
        </h1>
        <p className="text-zinc-600">
          Ayúdanos a mejorar Turnitos reportándonos cualquier problema que encuentres
        </p>
      </div>

      <Card className="border-2 border-zinc-200">
        <CardHeader>
          <CardTitle>Formulario de Reporte</CardTitle>
          <CardDescription>
            Completa la información del problema que encontraste. Responderemos a la brevedad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Tu nombre"
                  className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="tu@email.com"
                  className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger className="focus:ring-[#FFD60A] focus:border-[#FFD60A]">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Error / Bug</SelectItem>
                  <SelectItem value="ui">Problema de Interfaz</SelectItem>
                  <SelectItem value="performance">Lentitud / Performance</SelectItem>
                  <SelectItem value="payment">Problema con Pagos</SelectItem>
                  <SelectItem value="appointments">Problema con Turnos</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="Breve descripción del problema"
                className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción Detallada</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Describe el problema en detalle: qué estabas haciendo, qué esperabas que pasara y qué pasó realmente..."
                className="focus:ring-[#FFD60A] focus:border-[#FFD60A] min-h-32"
              />
            </div>

            <div>
              <Label htmlFor="url">URL donde ocurrió el problema</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                disabled
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Send size={20} className="mr-2" />
              {sending ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 border-zinc-200 mt-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-bold text-sm mb-1">Consejo</h3>
              <p className="text-sm text-zinc-600">
                Cuanto más detallado sea tu reporte, más rápido podremos solucionarlo. 
                Si puedes, incluye capturas de pantalla o pasos para reproducir el error.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportBug;