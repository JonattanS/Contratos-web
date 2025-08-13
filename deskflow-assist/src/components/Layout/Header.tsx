import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserMenu } from "../UserMenu"; 

export const Header = () => {
  return (
    <header className="border-b border-border px-6 py-4" style={{ backgroundColor: "#F57F2C" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <img
              src="/IMG/Logo-NovaCorp-oficial SIN FONDO.png"
              alt="NovaCorp Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Nova Cont</h1>
            <p className="text-sm font-semibold text-foreground">Área de Contabilidad</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          

          {/* Aquí el UserMenu que adapta la lógica desde el contexto */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
