import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, Phone, Users, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

export function AppLayout() {
  const { profile } = useAuthStore();
  
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 flex-col-reverse items-center">
      {/* We constrain the app to a mobile width on desktop for testing, but full width on mobile */}
      <div className="w-full h-full max-w-md bg-white dark:bg-gray-950 flex flex-col-reverse relative shadow-2xl md:border-x border-gray-200 dark:border-gray-800">
        
        {/* Navigation (Bottom) */}
        <nav className="flex h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 items-start justify-around border-t border-gray-200 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md px-2 z-20 pb-[env(safe-area-inset-bottom)] pt-2">
          <NavLink
            to="/chats"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500 rounded-lg transition-colors flex-1",
                isActive && "text-emerald-600 dark:text-emerald-500"
              )
            }
          >
            <MessageSquare size={24} />
            <span className="mt-1 text-[10px] font-medium">Chats</span>
          </NavLink>
          
          <NavLink
            to="/calls"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500 rounded-lg transition-colors flex-1",
                isActive && "text-emerald-600 dark:text-emerald-500"
              )
            }
          >
            <Phone size={24} />
            <span className="mt-1 text-[10px] font-medium">Calls</span>
          </NavLink>
          
          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500 rounded-lg transition-colors flex-1",
                isActive && "text-emerald-600 dark:text-emerald-500"
              )
            }
          >
            <Users size={24} />
            <span className="mt-1 text-[10px] font-medium">People</span>
          </NavLink>
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500 rounded-lg transition-colors flex-1",
                isActive && "text-emerald-600 dark:text-emerald-500"
              )
            }
          >
            <SettingsIcon size={24} />
            <span className="mt-1 text-[10px] font-medium">Settings</span>
          </NavLink>
        </nav>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          <Outlet />
        </div>
        
      </div>
    </div>
  );
}
