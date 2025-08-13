import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export const UserMenu = () => {
  const { user, logout } = useUser();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 px-3 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <User className="h-5 w-5" />
          <span>{user.usrnom || user.usrcod}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div>
            <span className="font-bold">{user.usrnom || user.usrcod}</span>
            <span className="block text-xs text-slate-500">{user.roldes || user.rolcod}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="h-4 w-4 mr-2" /> Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
