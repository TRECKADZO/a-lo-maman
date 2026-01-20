import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, Save, Loader2 } from 'lucide-react';

const SERVICES_DISPONIBLES = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale', color: 'bg-pink-100 text-pink-800' },
  { value: 'accouchement', label: 'Accouchement', color: 'bg-purple-100 text-purple-800' },
  { value: 'pediatrie', label: 'Pédiatrie', color: 'bg-blue-100 text-blue-800' },
  { value: 'echographie', label: 'Échographie', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'laboratoire', label: 'Laboratoire', color: 'bg-green-100 text-green-800' },
  { value: 'urgences', label: 'Urgences', color: 'bg-red-100 text-red-800' },
  { value: 'planification_familiale', label: 'Planification familiale', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'vaccination', label: 'Vaccination', color: 'bg-teal-100 text-teal-800' },
  { value: 'suivi_post_partum', label: 'Suivi post-partum', color: 'bg-orange-100 text-orange-800' },
];

export default function GestionServicesCentre({ centre }) {
  const queryClient = useQueryClient();
  const [servicesSelectionnes, setServicesSelectionnes] = useState(centre.services_offerts || []);

  const updateServicesMutation = useMutation({
    mutationFn: async (services) => {
      return await base44.entities.Clinique.update(centre.id, {
        services_offerts: services
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon_centre'] });
      alert('✅ Services mis à jour avec succès');
    },
  });

  const toggleService = (serviceValue) => {
    setServicesSelectionnes(prev =>
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
  };

  const hasChanges = JSON.stringify(servicesSelectionnes.sort()) !== JSON.stringify((centre.services_offerts || []).sort());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Gestion des Services Offerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {SERVICES_DISPONIBLES.map((service) => (
            <div
              key={service.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                servicesSelectionnes.includes(service.value)
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => toggleService(service.value)}
            >
              <Checkbox
                checked={servicesSelectionnes.includes(service.value)}
                onCheckedChange={() => toggleService(service.value)}
              />
              <div className="flex-1">
                <Badge className={service.color}>{service.label}</Badge>
              </div>
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Vous avez des modifications non enregistrées
            </p>
            <Button
              onClick={() => updateServicesMutation.mutate(servicesSelectionnes)}
              disabled={updateServicesMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateServicesMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer les modifications
            </Button>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Services actuellement actifs:</h4>
          <div className="flex flex-wrap gap-2">
            {servicesSelectionnes.length > 0 ? (
              servicesSelectionnes.map(service => {
                const serviceInfo = SERVICES_DISPONIBLES.find(s => s.value === service);
                return serviceInfo ? (
                  <Badge key={service} className={serviceInfo.color}>
                    {serviceInfo.label}
                  </Badge>
                ) : null;
              })
            ) : (
              <p className="text-gray-500 text-sm">Aucun service sélectionné</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}