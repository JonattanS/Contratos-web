import React, { createContext, useContext, useState, useEffect } from "react";

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
