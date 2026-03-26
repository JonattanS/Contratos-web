import React, { createContext, useContext, useState, useEffect } from "react";
import { BACKEND_URL } from "../config";

type UserType = {
  token: string;
  usrcod: string;
  adm_rolid: number;
  rolcod: string;
  roldes: string;
  [key: string]: any; // Para otros datos que quieras guardar
};

interface UserContextProps {
  user: any;
  login: (userData: any) => void;
  logout: () => void;
  canCreateMainFunctions: () => boolean;
  canDeleteMainFunctions: () => boolean;
  isAdmin: () => boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(() => {
    // Recupera usuario del localStorage si existe
    const data = localStorage.getItem("user");
    return data ? JSON.parse(data) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Timer de inactividad y auto-refresh de token
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let refreshIntervalId: ReturnType<typeof setInterval>;
    let lastActivityTime = Date.now();

    const resetActivity = () => {
      lastActivityTime = Date.now();
      
      if (timeoutId) clearTimeout(timeoutId);
      // 120 minutos = 120 * 60 * 1000 ms = 7200000 ms
      timeoutId = setTimeout(() => {
        if (user) {
          logout();
          alert("Tu sesión ha expirado por inactividad (120 minutos).");
        }
      }, 7200000);
    };

    if (user) {
      window.addEventListener("mousemove", resetActivity);
      window.addEventListener("keydown", resetActivity);
      window.addEventListener("click", resetActivity);
      window.addEventListener("scroll", resetActivity);
      resetActivity(); // Inicializar timer de primera vez

      // Auto-renovar token cada 15 min si hubo actividad reciente
      refreshIntervalId = setInterval(async () => {
         const timeSinceLastActivity = Date.now() - lastActivityTime;
         // Si el usuario estuvo activo en los ultimos 15 min (900000 ms), pide nuevo token
         if (timeSinceLastActivity < 900000 && user.token) {
            try {
              const res = await fetch(`${BACKEND_URL}/api/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: user.token })
              });
              const data = await res.json();
              if (data.success && data.token) {
                 setUser((prev) => prev ? { ...prev, token: data.token } : null);
              }
            } catch (err) {
               console.error("No se pudo renovar el token", err);
            }
         }
      }, 900000); // Revisar cada 15 min (900,000 ms)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (refreshIntervalId) clearInterval(refreshIntervalId);
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("click", resetActivity);
      window.removeEventListener("scroll", resetActivity);
    };
  }, [user]);

  const login = (userData: UserType) => setUser(userData);
  const logout = () => setUser(null);

  const canCreateMainFunctions = () => user?.rolcod === 'adm';
  const canDeleteMainFunctions = () => user?.rolcod === 'adm';
  const isAdmin = () => user?.rolcod === 'adm';

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        canCreateMainFunctions,
        canDeleteMainFunctions,
        isAdmin 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};
