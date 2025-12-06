import React, { createContext, useContext, useState, useEffect } from 'react';

const LightModeContext = createContext({
  isLightMode: false,
  setLightMode: () => {},
  connectionSpeed: 'fast',
  cacheData: () => {},
  getCachedData: () => null,
});

// Cache en mémoire + localStorage
const dataCache = new Map();
const CACHE_PREFIX = 'alo_cache_';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24h

export function LightModeProvider({ children }) {
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('alo_light_mode') === 'true';
  });
  const [connectionSpeed, setConnectionSpeed] = useState('fast');

  // Détecter la connexion
  useEffect(() => {
    const detectConnection = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        
        // 2G ou connexion très lente
        if (effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5) {
          setConnectionSpeed('2g');
          if (!localStorage.getItem('alo_light_mode_prompted')) {
            setIsLightMode(true);
            localStorage.setItem('alo_light_mode', 'true');
          }
        } else if (effectiveType === '3g' || downlink < 1.5) {
          setConnectionSpeed('3g');
        } else {
          setConnectionSpeed('fast');
        }

        connection.addEventListener('change', detectConnection);
      }
    };

    detectConnection();
  }, []);

  // Sauvegarder préférence
  useEffect(() => {
    localStorage.setItem('alo_light_mode', isLightMode.toString());
    localStorage.setItem('alo_light_mode_prompted', 'true');
  }, [isLightMode]);

  // Cache avec localStorage fallback
  const cacheData = (key, data, duration = CACHE_DURATION) => {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + duration
    };
    
    dataCache.set(key, cacheEntry);
    
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheEntry));
    } catch (e) {
      // localStorage plein, nettoyer les anciennes entrées
      cleanOldCache();
    }
  };

  const getCachedData = (key) => {
    // Vérifier cache mémoire d'abord
    if (dataCache.has(key)) {
      const entry = dataCache.get(key);
      if (entry.expires > Date.now()) {
        return entry.data;
      }
      dataCache.delete(key);
    }

    // Sinon localStorage
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        const entry = JSON.parse(stored);
        if (entry.expires > Date.now()) {
          dataCache.set(key, entry);
          return entry.data;
        }
        localStorage.removeItem(CACHE_PREFIX + key);
      }
    } catch (e) {}

    return null;
  };

  const cleanOldCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => {
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry.expires < Date.now()) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    });
  };

  return (
    <LightModeContext.Provider value={{
      isLightMode,
      setLightMode: setIsLightMode,
      connectionSpeed,
      cacheData,
      getCachedData
    }}>
      {children}
    </LightModeContext.Provider>
  );
}

export const useLightMode = () => useContext(LightModeContext);

// Hook pour données avec cache
export function useCachedQuery(key, queryFn, options = {}) {
  const { getCachedData, cacheData, isLightMode } = useLightMode();
  const [data, setData] = useState(() => getCachedData(key));
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Si on a des données en cache et mode léger, ne pas refetch
      if (data && isLightMode) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await queryFn();
        setData(result);
        cacheData(key, result, options.cacheDuration);
      } catch (e) {
        setError(e);
        // En cas d'erreur, utiliser le cache même expiré
        const cached = getCachedData(key);
        if (cached) setData(cached);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key]);

  return { data, isLoading, error, refetch: () => setData(null) };
}