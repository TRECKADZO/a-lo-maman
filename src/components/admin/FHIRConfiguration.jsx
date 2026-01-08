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
import { Loader2, Save, CheckCircle, AlertCircle, Copy, RefreshCw, Shield, Key } from 'lucide-react';

const SCOPES_DISPONIBLES = [
  'read:patients',
  'write:patients',
  'read:practitioners',
  'write:practitioners',
  'read:organizations',
  'write:organizations',
  'read:encounters',
  'write:encounters',
  'read:observations',
  'write:observations',
  'read:appointments',
  'write:appointments',
  'read:immunizations',
  'write:immunizations',
  'read:procedures',
  'write:procedures',
  'read:documents',
  'write:documents',
  'admin:webhooks',
  'admin:statistics',
];

export default function FHIRConfiguration({ centre, onSave }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    api_fhir_enabled: centre?.api_fhir_enabled || false,
    fhir_endpoint: centre?.fhir_endpoint || '',
    api_scopes: centre?.api_scopes || [],
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Clinique.update(centre.id, data);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['centres'] });
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
      onSave?.();
    },
  });

  const generateKeyMutation = useMutation({
    mutationFn: async () => {
      const newKey = 'fhir_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await base44.entities.Clinique.update(centre.id, {
        api_key: newKey,
        api_key_generated_at: new Date().toISOString(),
      });
      return newKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centres'] });
    },
  });

  const handleScopeToggle = (scope) => {
    setFormData(prev => ({
      ...prev,
      api_scopes: prev.api_scopes.includes(scope)
        ? prev.api_scopes.filter(s => s !== scope)
        : [...prev.api_scopes, scope]
    }));
  };

  const handleSave = async () => {
    if (!formData.fhir_endpoint.trim()) {
      alert('L\'endpoint FHIR est obligatoire');
      return;
    }
    await updateMutation.mutate(formData);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-4">
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Configuration FHIR mise à jour
          </AlertDescription>
        </Alert>
      )}

      {/* Clé API */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Authentification API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {centre?.api_key ? (
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Clé API</p>
                  <p className="font-mono text-sm truncate">{centre.api_key}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(centre.api_key)}
                  className="flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {centre.api_key_generated_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Générée: {new Date(centre.api_key_generated_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Aucune clé API générée</p>
          )}
          <Button
            onClick={() => generateKeyMutation.mutate()}
            disabled={generateKeyMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generateKeyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Générer une nouvelle clé
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500">⚠️ Générer une nouvelle clé invalidera l'ancienne</p>
        </CardContent>
      </Card>

      {/* Configuration */}
      {!isEditing ? (
        <Card className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Paramètres FHIR</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Statut: {centre?.api_fhir_enabled ? (
                  <Badge className="bg-green-100 text-green-800">Activé</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Désactivé</Badge>
                )}
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Éditer
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Endpoint FHIR</p>
              <p className="font-mono text-sm">{centre?.fhir_endpoint || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Scopes autorisés ({centre?.api_scopes?.length || 0})</p>
              <div className="flex flex-wrap gap-1">
                {centre?.api_scopes?.length > 0 ? (
                  centre.api_scopes.map(scope => (
                    <Badge key={scope} className="bg-blue-100 text-blue-800 text-xs">
                      {scope}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun scope configuré</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Éditer configuration FHIR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fhir_enabled"
                  checked={formData.api_fhir_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, api_fhir_enabled: checked }))}
                />
                <Label htmlFor="fhir_enabled">Activer l'intégration FHIR</Label>
              </div>
            </div>

            {formData.api_fhir_enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint FHIR *</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://fhir.exemple.com/base"
                    value={formData.fhir_endpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, fhir_endpoint: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">URL de base du serveur FHIR</p>
                </div>

                <div className="space-y-2">
                  <Label>Scopes d'accès</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {SCOPES_DISPONIBLES.map(scope => (
                      <div key={scope} className="flex items-center gap-2">
                        <Checkbox
                          id={scope}
                          checked={formData.api_scopes.includes(scope)}
                          onCheckedChange={() => handleScopeToggle(scope)}
                        />
                        <Label htmlFor={scope} className="text-xs cursor-pointer">
                          {scope}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Sélectionnez les scopes nécessaires</p>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}