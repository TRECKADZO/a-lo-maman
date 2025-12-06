import React from 'react';
import { useLightMode } from './LightModeProvider';
import { Zap, ZapOff, Wifi, WifiOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function LightModeToggle({ compact = false }) {
  const { isLightMode, setLightMode, connectionSpeed } = useLightMode();

  const getConnectionIcon = () => {
    if (connectionSpeed === '2g') return <WifiOff className="w-4 h-4 text-orange-500" />;
    if (connectionSpeed === '3g') return <Wifi className="w-4 h-4 text-yellow-500" />;
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  if (compact) {
    return (
      <button
        onClick={() => setLightMode(!isLightMode)}
        className={`p-2 rounded-full ${isLightMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
        title={isLightMode ? 'Mode léger activé' : 'Activer le mode léger'}
      >
        {isLightMode ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isLightMode ? 'bg-green-100' : 'bg-gray-200'}`}>
          <Zap className={`w-5 h-5 ${isLightMode ? 'text-green-600' : 'text-gray-500'}`} />
        </div>
        <div>
          <p className="font-medium text-sm">Mode économie données</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getConnectionIcon()}
            <span>
              {connectionSpeed === '2g' ? 'Connexion lente détectée' : 
               connectionSpeed === '3g' ? 'Connexion moyenne' : 'Bonne connexion'}
            </span>
          </div>
        </div>
      </div>
      <Switch checked={isLightMode} onCheckedChange={setLightMode} />
    </div>
  );
}