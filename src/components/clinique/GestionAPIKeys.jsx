import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Key, Copy, RotateCw, Eye, EyeOff, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';

export default function GestionAPIKeys({ clinique }) {
  const [showKey, setShowKey] = useState(false);
  const [newScopes, setNewScopes] = useState(clinique.api_scopes || []);
  const queryClient = useQueryClient();

  const scopesDisponibles = [
    { value: 'read:patients', label: 'Lire profils patients', type: 'lecture', desc: 'Accès lecture aux profils' },
    { value: 'write:patients', label: 'Créer/modifier patients', type: 'ecriture', desc: 'Création et modification' },
    { value: 'read:appointments', label: 'Lire rendez-vous', type: 'lecture', desc: 'Consultation des RDV' },
    { value: 'write:appointments', label: 'Gérer rendez-vous', type: 'ecriture', desc: 'CRUD complet RDV' },
    { value: 'read:observations', label: 'Lire observations', type: 'lecture', desc: 'Données cliniques' },
    { value: 'write:observations', label: 'Créer observations', type: 'ecriture', desc: 'Enregistrement données' },
    { value: 'read:documents', label: 'Télécharger documents', type: 'lecture', desc: 'Résultats, ordonnances' },
    { value: 'write:documents', label: 'Uploader documents', type: 'ecriture', desc: 'Transmission documents' },
    { value: 'read:immunizations', label: 'Lire vaccinations', type: 'lecture', desc: 'Calendrier vaccinal' },
    { value: 'write:immunizations', label: 'Enregistrer vaccins', type: 'ecriture', desc: 'Saisie vaccinations' },
    { value: 'admin:webhooks', label: 'Gérer webhooks', type: 'admin', desc: 'Configuration webhooks' },
    { value: 'admin:statistics', label: 'Stats agrégées', type: 'admin', desc: 'Rapports anonymisés' },
    { value: 'fhir:*', label: 'Accès FHIR complet', type: 'admin', desc: 'Tous endpoints FHIR' }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const regenererCle = useMutation({
    mutationFn: async () => {
      const newKey = 'ak_' + crypto.randomUUID().replace(/-/g, '');
      await base44.entities.Clinique.update(clinique.id, {
        api_key: newKey,
        api_key_generated_at: new Date().toISOString()
      });
      return newKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cliniques']);
      toast.success('Nouvelle clé API générée');
    }
  });

  const updateScopes = useMutation({
    mutationFn: async () => {
      await base44.entities.Clinique.update(clinique.id, {
        api_scopes: newScopes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cliniques']);
      toast.success('Scopes mis à jour');
    }
  });

  const toggleScope = (scope) => {
    setNewScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      {/* Clé API */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Clé API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Votre clé API (à garder secrète)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={clinique.api_key || 'Aucune clé générée'}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(clinique.api_key)}
                disabled={!clinique.api_key}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Régénérer la clé API ? L\'ancienne clé ne fonctionnera plus.')) {
                  regenererCle.mutate();
                }
              }}
              disabled={regenererCle.isPending}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Régénérer
            </Button>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Sécurité :</strong> Ne partagez jamais votre clé API. 
                Stockez-la de manière chiffrée côté serveur uniquement.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scopes */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Scopes & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {scopesDisponibles.map((scope) => (
              <div key={scope.value} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border">
                <Checkbox
                  id={scope.value}
                  checked={newScopes.includes(scope.value)}
                  onCheckedChange={() => toggleScope(scope.value)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor={scope.value} className="cursor-pointer font-semibold">
                      {scope.label}
                    </Label>
                    <Badge variant={
                      scope.type === 'lecture' ? 'outline' : 
                      scope.type === 'ecriture' ? 'default' : 'secondary'
                    } className="text-xs">
                      {scope.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{scope.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {JSON.stringify(newScopes) !== JSON.stringify(clinique.api_scopes) && (
            <Button
              onClick={() => updateScopes.mutate()}
              disabled={updateScopes.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Sauvegarder les permissions
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Endpoint FHIR */}
      {clinique.api_fhir_enabled && (
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Endpoint FHIR R4
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>URL de base</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={window.location.origin + '/functions/fhirEndpointEnhanced'}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(window.location.origin + '/functions/fhirEndpointEnhanced')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900 mb-2">
                <strong>Ressources supportées :</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {['Patient', 'Practitioner', 'Organization', 'Encounter', 'Observation', 'Appointment', 'Immunization'].map(r => (
                  <Badge key={r} className="bg-green-100 text-green-800">{r}</Badge>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Exemple d'utilisation :</strong>
              </p>
              <code className="block mt-2 p-2 bg-white rounded text-xs">
                GET /functions/fhirEndpointEnhanced/Patient/123<br/>
                Authorization: Bearer {clinique.api_key?.slice(0, 20)}...
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}