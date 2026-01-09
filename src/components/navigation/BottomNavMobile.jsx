import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Calendar, Baby, Settings, Bell, MoreVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const PRIMARY_LINKS = [
  { path: '0_Accueil', icon: Home, label: 'Accueil' },
  { path: 'Dashboard', icon: Calendar, label: 'RDV' },
  { path: 'Enfants', icon: Baby, label: 'Carnet' },
  { path: 'Parametres', icon: Settings, label: 'Param' }
];

const SECONDARY_LINKS = [
  { path: 'MesRappels', icon: Bell, label: 'Rappels' },
  { path: 'Grossesse', icon: '🤰', label: 'Grossesse' },
  { path: 'Messagerie', icon: '💬', label: 'Messages' },
  { path: 'Support', icon: '❓', label: 'Support' }
];

export default function BottomNavMobile() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <>
      {/* Barre de navigation inférieure */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t z-40 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-16">
          {/* Liens principaux */}
          {PRIMARY_LINKS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={createPageUrl(path)}
                className={`flex flex-col items-center justify-center flex-1 h-16 transition-colors ${
                  active
                    ? 'text-pink-600 border-t-2 border-pink-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {typeof Icon === 'string' ? (
                  <span className="text-xl mb-1">{Icon}</span>
                ) : (
                  <Icon className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Menu supplémentaire */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-16 text-gray-600 hover:text-gray-900 transition-colors">
                <MoreVertical className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Plus</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <div className="grid grid-cols-2 gap-3 pt-4 pb-8">
                {SECONDARY_LINKS.map(({ path, icon, label }) => (
                  <Link
                    key={path}
                    to={createPageUrl(path)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {typeof icon === 'string' ? (
                      <span className="text-2xl mb-2">{icon}</span>
                    ) : (
                      <icon className="w-6 h-6 mb-2" />
                    )}
                    <span className="text-xs text-center font-medium">{label}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer pour éviter que le contenu soit caché */}
      <div className="h-16 lg:hidden" style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />
    </>
  );
}