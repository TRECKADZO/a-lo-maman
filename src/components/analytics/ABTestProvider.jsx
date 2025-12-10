import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ABTestContext = createContext({});

export const useABTest = () => useContext(ABTestContext);

/**
 * Provider pour les tests A/B
 * Gère l'assignation des variantes et le tracking
 */
export default function ABTestProvider({ children }) {
  const [assignments, setAssignments] = useState({});

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: activeTests = [] } = useQuery({
    queryKey: ['ab_tests_active'],
    queryFn: async () => {
      const tests = await base44.entities.ABTest.filter({ status: 'active' });
      return tests;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (!user || activeTests.length === 0) return;

    const newAssignments = {};

    activeTests.forEach(test => {
      // Check if user already assigned
      const stored = localStorage.getItem(`ab_test_${test.id}`);
      
      if (stored) {
        newAssignments[test.test_name] = stored;
      } else {
        // Assign variant based on traffic percentage
        const variant = assignVariant(test.variants);
        newAssignments[test.test_name] = variant.id;
        localStorage.setItem(`ab_test_${test.id}`, variant.id);
        
        // Track assignment
        trackEvent('ab_test_assigned', {
          test_name: test.test_name,
          variant: variant.id
        });
      }
    });

    setAssignments(newAssignments);
  }, [user, activeTests]);

  const assignVariant = (variants) => {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.traffic_percentage;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[0]; // Fallback
  };

  const getVariant = (testName) => {
    return assignments[testName] || 'control';
  };

  const trackEvent = async (eventName, properties = {}) => {
    if (!user) return;

    try {
      await base44.entities.AnalyticsEvent.create({
        user_email: user.email,
        session_id: getSessionId(),
        event_name: eventName,
        event_category: 'conversion',
        page: window.location.pathname,
        properties: properties,
        ab_test_variant: JSON.stringify(assignments),
        timestamp: new Date().toISOString(),
        device_info: {
          user_agent: navigator.userAgent,
          screen_width: window.screen.width,
          platform: navigator.platform,
          connection_type: navigator.connection?.effectiveType || 'unknown'
        }
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  return (
    <ABTestContext.Provider value={{ getVariant, trackEvent, assignments }}>
      {children}
    </ABTestContext.Provider>
  );
}