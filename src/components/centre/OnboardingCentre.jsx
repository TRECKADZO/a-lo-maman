import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  CheckCircle,
  ChevronRight,
  Settings,
  Users,
  Shield,
  Loader2
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const SERVICES_DISPONIBLES = [
  'consultation_prenatale',
  'accouchement',
  'pediatrie',
  'echographie',
  'laboratoire',
  'urgences',
  'planification_familiale',
  'vaccination',
  'suivi_post_partum'
];

const API_SCOPES_DISPONIBLES = [
  'read:patients',
  'write:patients',
  'read:practitioners',
  'write:practitioners',
  'read:observations',
  'write:observations',
  'read:appointments',
  'write:appointments',
  'read:immunizations',
  'write:immunizations',
  'read:documents',
  'write:documents'
];

export default function OnboardingCentre({ centre, onComplete }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1: Informations détaillées
    adresse: centre.adresse || '',
    numero_agrement: centre.numero_agrement || '',
    capacite_lits: centre.capacite_lits || 0,
    services_offerts: centre.services_offerts || [],
    
    // Étape 2: API/FHIR
    api_scopes: centre.api_scopes || [],
    
    // Étape 3: Utilisateurs
    utilisateurs_invites: []
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const completerOnboarding = useMutation({
    mutationFn: async () => {
      const codeInvitation = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      await base44.entities.Clinique.update(centre.id, {
        adresse: formData.adresse,
        numero_agrement: formData.numero_agrement,
        capacite_lits: parseInt(formData.capacite_lits) || 0,
        services_offerts: formData.services_offerts,
        api_scopes: formData.api_scopes,
        code_invitation: codeInvitation,
        onboarding_completed: true
      });

      // Inviter les utilisateurs
      for (const email of formData.utilisateurs_invites) {
        if (email.trim()) {
          try {
            await base44.users.inviteUser(email.trim(), 'admin');
            
            // Ajouter aux administrateurs du centre
            const admins = centre.administrateurs || [centre.administrateur_email];
            if (!admins.includes(email.trim())) {
              await base44.entities.Clinique.update(centre.id, {
                administrateurs: [...admins, email.trim()]
              });
            }
          } catch (err) {
            console.warn('Erreur invitation:', email, err);
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Configuration terminée !');
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast.error('Erreur lors de la configuration');
      console.error(error);
    }
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completerOnboarding.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services_offerts: prev.services_offerts.includes(service)
        ? prev.services_offerts.filter(s => s !== service)
        : [...prev.services_offerts, service]
    }));
  };

  const toggleScope = (scope) => {
    setFormData(prev => ({
      ...prev,
      api_scopes: prev.api_scopes.includes(scope)
        ? prev.api_scopes.filter(s => s !== scope)
        : [...prev.api_scopes, scope]
    }));
  };

  const ajouterUtilisateur = () => {
    setFormData(prev => ({
      ...prev,
      utilisateurs_invites: [...prev.utilisateurs_invites, '']
    }));
  };

  const updateUtilisateur = (index, value) => {
    setFormData(prev => ({
      ...prev,
      utilisateurs_invites: prev.utilisateurs_invites.map((u, i) => i === index ? value : u)
    }));
  };

  const supprimerUtilisateur = (index) => {
    setFormData(prev => ({
      ...prev,
      utilisateurs_invites: prev.utilisateurs_invites.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Configuration de {centre.nom}</CardTitle>
                <p className="text-sm text-gray-600">Étape {currentStep} sur {totalSteps}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Étape 1: Informations détaillées */}
        {currentStep === 1 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Informations du Centre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse complète *</Label>
                <Textarea
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Rue, quartier, commune..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agrement">Numéro d'agrément MSP</Label>
                  <Input
                    id="agrement"
                    value={formData.numero_agrement}
                    onChange={(e) => setFormData({ ...formData, numero_agrement: e.target.value })}
                    placeholder="AG/MSP/2024/XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacite">Capacité (lits)</Label>
                  <Input
                    id="capacite"
                    type="number"
                    value={formData.capacite_lits}
                    onChange={(e) => setFormData({ ...formData, capacite_lits: e.target.value })}
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Services offerts *</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {SERVICES_DISPONIBLES.map(service => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={formData.services_offerts.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <label
                        htmlFor={service}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: API/FHIR */}
        {currentStep === 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Configuration API & FHIR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Vos accès API</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Clé API:</p>
                    <code className="bg-white px-3 py-1 rounded border text-xs block mt-1 break-all">
                      {centre.api_key}
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-600">Endpoint FHIR:</p>
                    <code className="bg-white px-3 py-1 rounded border text-xs block mt-1 break-all">
                      {centre.fhir_endpoint || 'Non configuré'}
                    </code>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissions API demandées</Label>
                <p className="text-sm text-gray-600">
                  Sélectionnez les accès nécessaires pour l'intégration de votre système
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {API_SCOPES_DISPONIBLES.map(scope => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        id={scope}
                        checked={formData.api_scopes.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                      />
                      <label
                        htmlFor={scope}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {scope}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  💡 <strong>Documentation:</strong> Consultez notre{' '}
                  <a href="/api-docs" className="underline font-semibold">documentation API</a>
                  {' '}pour l'intégration complète.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Utilisateurs */}
        {currentStep === 3 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Gestion des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  <strong>Administrateur principal:</strong> {centre.administrateur_email}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Inviter des administrateurs</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={ajouterUtilisateur}
                  >
                    + Ajouter
                  </Button>
                </div>

                {formData.utilisateurs_invites.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Vous pouvez inviter d'autres membres de votre équipe (optionnel)
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.utilisateurs_invites.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => updateUtilisateur(index, e.target.value)}
                          placeholder="email@exemple.com"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => supprimerUtilisateur(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  ℹ️ Les utilisateurs invités recevront un email pour créer leur compte avec
                  accès administrateur au centre.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || completerOnboarding.isPending}
              >
                Précédent
              </Button>

              <Button
                onClick={handleNext}
                disabled={completerOnboarding.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {completerOnboarding.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalisation...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}