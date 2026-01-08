import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, Shield, Trash2, Plus, CheckCircle } from 'lucide-react';

const SERVICES = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale' },
  { value: 'accouchement', label: 'Accouchement' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'echographie', label: 'Échographie' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'planification_familiale', label: 'Planification familiale' },
];

export default function GestionCentreSanteAdmin({ centre }) {
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState('');
  const [selectedServices, setSelectedServices] = useState(centre?.services_offerts || centre?.types_echographie || []);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isClinique = centre.type === 'clinique';

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (isClinique) {
        await base44.entities.Clinique.update(centre.id, data);
      } else {
        await base44.entities.CentreTeleEchographie.update(centre.id, data);
      }
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: isClinique ? ['cliniques'] : ['centres_teleecho'] });
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const handleSaveServices = async () => {
    const fieldName = isClinique ? 'services_offerts' : 'types_echographie';
    await updateMutation.mutate({ [fieldName]: selectedServices });
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.trim()) return;

    const admins = centre.administrateurs || [];
    if (!admins.includes(newAdmin.trim())) {
      await updateMutation.mutate({ 
        administrateurs: [...admins, newAdmin.trim()] 
      });
      setNewAdmin('');
    }
  };

  const handleRemoveAdmin = async (email) => {
    const admins = (centre.administrateurs || []).filter(a => a !== email);
    await updateMutation.mutate({ administrateurs: admins });
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Modifications sauvegardées
          </AlertDescription>
        </Alert>
      )}

      {/* Services */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Services offerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map(service => (
              <div key={service.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={service.value}
                  checked={selectedServices.includes(service.value)}
                  onCheckedChange={() => toggleService(service.value)}
                />
                <Label htmlFor={service.value} className="cursor-pointer flex-1">
                  {service.label}
                </Label>
              </div>
            ))}
          </div>
          <Button
            onClick={handleSaveServices}
            disabled={updateMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder les services'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Administrateurs */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Administrateurs ({centre.administrateurs?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(centre.administrateurs || []).map((admin, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">{admin}</p>
                  {admin === centre.administrateur_email && (
                    <Badge className="bg-blue-100 text-blue-800 mt-1">Propriétaire</Badge>
                  )}
                </div>
                {admin !== centre.administrateur_email && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveAdmin(admin)}
                    disabled={updateMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="new-admin">Ajouter administrateur</Label>
            <div className="flex gap-2">
              <Input
                id="new-admin"
                type="email"
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                placeholder="email@exemple.com"
              />
              <Button
                onClick={handleAddAdmin}
                disabled={!newAdmin.trim() || updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}