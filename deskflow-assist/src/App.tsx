import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Agrega esta importación, ajusta la ruta si cambia en tu proyecto
import { UserProvider, useUser } from "@/contexts/UserContext";

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
// IMPORTA o crea HomePage, aquí pongo un placeholder simple
const HomePage = () => <div>Página principal</div>;

/**
 * ProtectedRoute: componente para proteger rutas que requieren usuario autenticado
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();

  if (!user) {
    // Si no hay usuario, redirige a login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * MainLayout para mostrar roles y el contenido principal
 */
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();

  const renderRoleBanner = () => {
    if (user?.rolcod === "adm") {
      return <p className="text-sm text-green-600 font-semibold">Adm</p>;
    }
    if (user?.rolcod === "teso") {
      return <p className="text-sm text-yellow-600 font-semibold">Teso</p>;
    }
    if (user?.rolcod === "conta") {
      return <p className="text-sm text-blue-600 font-semibold">Cont</p>;
    }
    return null; // O algún banner por defecto si quieres
  };

  return (
    <div>
      {renderRoleBanner()}
      {children}
    </div>
  );
};

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { login } = useUser();

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={login} />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
