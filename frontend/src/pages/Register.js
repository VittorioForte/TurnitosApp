import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import api from '../utils/api';

const Register = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        business_name: businessName,
      });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.token);
      toast.success('¡Cuenta creada! Tienes 7 días de prueba gratis');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md border-2 border-black hard-shadow" data-testid="register-card">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-[#FFD60A] uppercase tracking-tight" data-testid="brand-logo">
              TURNITOS
            </h1>
          </div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>7 días de prueba gratis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="business_name">Nombre del Negocio</Label>
              <Input
                id="business_name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                data-testid="business-name-input"
                placeholder="Barbería El Corte"
                className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
                placeholder="tu@email.com"
                className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="focus:ring-[#FFD60A] focus:border-[#FFD60A]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full bg-[#FFD60A] text-black hover:bg-[#EAB308] font-bold uppercase tracking-wide hard-shadow-sm border border-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta Gratis'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-zinc-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#FFD60A] font-semibold hover:underline" data-testid="login-link">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;