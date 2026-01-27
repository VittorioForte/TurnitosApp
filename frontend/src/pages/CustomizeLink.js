import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api from '../utils/api';

const CustomizeLink = () => {
  const [customSlug, setCustomSlug] = useState('');
  const [currentSlug, setCurrentSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadCurrentSlug();
  }, []);

  const loadCurrentSlug = async () => {
    try {
      const response = await api.get('/user/custom-slug');
      const slug = response.data.custom_slug || user.user_id;
      setCurrentSlug(slug);
      setCustomSlug(slug);
    } catch (error) {
      setCurrentSlug(user.user_id);
      setCustomSlug(user.user_id);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customSlug || customSlug.length < 3) {
      toast.error('El slug debe tener al menos 3 caracteres');
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(customSlug)) {
      toast.error('Solo letras minúsculas, números y guiones');
      return;
    }

    setSaving(true);
    try {
      await api.put('/user/custom-slug', { custom_slug: customSlug });
      setCurrentSlug(customSlug);
      toast.success('Link personalizado actualizado');
      // Disparar evento para actualizar otras páginas
      window.dispatchEvent(new CustomEvent('slugUpdated', { detail: { slug: customSlug } }));
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Este slug ya está en uso. Elige otro.');
      } else {
        toast.error('Error al actualizar el link');
      }
    } finally {
      setSaving(false);
    }
  };

  const getPublicUrl = () => {
    return `${window.location.origin}/book/${currentSlug}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    toast.success('Link copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div data-testid="customize-link-page" className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <LinkIcon size={36} />
          LINK PÚBLICO
        </h1>
        <p className="text-zinc-600">Personaliza tu link de reservas</p>
      </div>

      <Card className="border-2 border-zinc-200">
        <CardHeader>
          <CardTitle>Tu Link Público Actual</CardTitle>
          <CardDescription>
            Este es el link que tus clientes usarán para reservar turnos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              value={getPublicUrl()}
              readOnly
              className="flex-1 font-mono text-sm bg-zinc-50"
            />
            <Button
              onClick={handleCopy}
              className="bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </Button>
          </div>

          <div className="border-t pt-6">
            <Label htmlFor="customSlug" className="text-base font-bold mb-2 block">
              Personalizar Link
            </Label>
            <p className="text-sm text-zinc-600 mb-4">
              Cambia la parte final del link por algo más fácil de recordar
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">{window.location.origin}/book/</span>
                <Input
                  id="customSlug"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="mi-negocio"
                  className="max-w-xs focus:ring-[#FFD60A] focus:border-[#FFD60A]"
                />
              </div>
              
              <p className="text-xs text-zinc-500">
                Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Ejemplos:</strong> barberia-el-corte, estetica-bella, consultorio-medico
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || customSlug === currentSlug}
                className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-zinc-200 mt-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-bold text-sm mb-1">Consejo</h3>
              <p className="text-sm text-zinc-600">
                Elige un nombre relacionado con tu negocio para que sea fácil de recordar y compartir. 
                Una vez que cambies el link, el anterior dejará de funcionar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomizeLink;