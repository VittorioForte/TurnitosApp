import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Scissors, 
  Clock, 
  Calendar, 
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/services', icon: Scissors, label: 'Servicios' },
    { path: '/business-hours', icon: Clock, label: 'Horarios' },
    { path: '/appointments', icon: Calendar, label: 'Turnos' },
    { path: '/subscription', icon: CreditCard, label: 'Suscripción' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#09090B] border-r border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-[#FFD60A] tracking-tight" data-testid="app-logo">
            TURNITOS
          </h1>
          <p className="text-xs text-zinc-400 mt-1">{user.business_name}</p>
        </div>
        
        <nav className="flex-1 p-4" data-testid="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-[#FFD60A] border-l-4 border-[#FFD60A]'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            onClick={onLogout}
            data-testid="logout-button"
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <LogOut size={20} className="mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#09090B] border-b border-zinc-800 z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-[#FFD60A]" data-testid="app-logo-mobile">
            TURNITOS
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
            className="text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
        
        {mobileMenuOpen && (
          <nav className="bg-[#09090B] border-t border-zinc-800 p-4" data-testid="mobile-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                    isActive
                      ? 'bg-zinc-800 text-[#FFD60A]'
                      : 'text-zinc-400'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="w-full justify-start text-zinc-400 mt-4"
            >
              <LogOut size={20} className="mr-3" />
              Cerrar Sesión
            </Button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-16 md:mt-0">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;