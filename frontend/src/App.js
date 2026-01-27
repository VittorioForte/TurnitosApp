import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import BusinessHours from './pages/BusinessHours';
import Appointments from './pages/Appointments';
import Subscription from './pages/Subscription';
import PublicBooking from './pages/PublicBooking';
import Layout from './components/Layout';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route path="/book/:userId" element={<PublicBooking />} />
        
        <Route path="/" element={
          token ? <Layout onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/dashboard" element={
          token ? <Layout onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/services" element={
          token ? <Layout onLogout={handleLogout}><Services /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/business-hours" element={
          token ? <Layout onLogout={handleLogout}><BusinessHours /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/appointments" element={
          token ? <Layout onLogout={handleLogout}><Appointments /></Layout> : <Navigate to="/login" />
        } />
        <Route path="/subscription" element={
          token ? <Layout onLogout={handleLogout}><Subscription /></Layout> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;