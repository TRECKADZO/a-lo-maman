import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Trash2, Plus, Users, Shield } from 'lucide-react';
import GestionCentreSante from './GestionCentreSanteAdmin';

export default function EditerCentre({ centre, onBack, onUpdate }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    statut_validation: centre.statut_validation || 'en_attente',
    adresse: centre.adresse || '',
    numero_agrement: centre.numero_agrement || '',
    api_fhir_enabled: centre.api_fhir_enabled || false,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isClinique = centre.type === 'clinique';
  const isTeleEcho = centre.type === 'teleecho';

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
      setTimeout(() => {
        setSaveSuccess(false);
        onUpdate?.();
      }, 1500);
    },
  });

  const handleStatusChange = async (newStatus) => {
    await updateMutation.mutate({ statut_validation: newStatus });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        {saveSuccess && (
          <Alert className="bg-green-50 border-green-300">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-800 ml-2">
              ✅ Modifications sauvegardées avec succès
            </AlertDescription>
          </Alert>
        )}

        {/* Info centre */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-2xl">{isClinique ? centre.nom : centre.nom_centre}</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {isClinique 
                ? centre.type_etablissement?.replace(/_/g, ' ')
                : centre.type_etablissement?.replace(/_/g, ' ')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="font-medium">{centre.email_contact || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Téléphone</Label>
                <p className="font-medium">{centre.telephone || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Ville</Label>
                <p className="font-medium">{centre.ville || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Région</Label>
                <p className="font-medium">{centre.region || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation & Approval */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Validation du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Statut actuel</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Badge 
                  className={
                    formData.statut_validation === 'approuve' 
                      ? 'bg-green-100 text-green-800' 
                      : formData.statut_validation === 'en_attente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {formData.statut_validation}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleStatusChange('en_attente')}
                variant={formData.statut_validation === 'en_attente' ? 'default' : 'outline'}
                className="text-sm"
              >
                En attente
              </Button>
              <Button
                onClick={() => handleStatusChange('approuve')}
                variant={formData.statut_validation === 'approuve' ? 'default' : 'outline'}
                className={formData.statut_validation === 'approuve' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Approuver
              </Button>
              <Button
                onClick={() => handleStatusChange('rejete')}
                variant={formData.statut_validation === 'rejete' ? 'destructive' : 'outline'}
              >
                Rejeter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info supplémentaires */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Informations du centre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                placeholder="Adresse complète"
              />
            </div>

            {isClinique && (
              <div className="space-y-2">
                <Label htmlFor="numero_agrement">Numéro d'agrément MSP</Label>
                <Input
                  id="numero_agrement"
                  value={formData.numero_agrement}
                  onChange={(e) => handleInputChange('numero_agrement', e.target.value)}
                  placeholder="Ex: MSP-2024-001"
                />
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="fhir_enabled"
                checked={formData.api_fhir_enabled}
                onCheckedChange={(checked) => handleInputChange('api_fhir_enabled', checked)}
              />
              <Label htmlFor="fhir_enabled" className="cursor-pointer flex-1">
                Intégration FHIR activée
              </Label>
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder les modifications'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Gestion Services & Admins */}
        <GestionCentreSanteAdmin centre={centre} />
      </div>
    </div>
  );
}