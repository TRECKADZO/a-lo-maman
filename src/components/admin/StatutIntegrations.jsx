import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, XCircle, Zap, Key, Database } from 'lucide-react';

export default function StatutIntegrations({ centre }) {
  const fhirEnabled = centre.api_fhir_enabled;
  const hasApiKey = !!centre.api_key;
  const hasWebhooks = centre.webhooks?.length > 0;
  const hasScopes = centre.api_scopes?.length > 0;

  const integrations = [
    {
      name: 'API FHIR',
      enabled: fhirEnabled,
      icon: Zap,
      color: fhirEnabled ? 'text-green-600' : 'text-gray-400'
    },
    {
      name: 'Clé API',
      enabled: hasApiKey,
      icon: Key,
      color: hasApiKey ? 'text-blue-600' : 'text-gray-400'
    },
    {
      name: 'Webhooks',
      enabled: hasWebhooks,
      icon: Database,
      color: hasWebhooks ? 'text-purple-600' : 'text-gray-400',
      count: centre.webhooks?.length || 0
    }
  ];

  const apiKeyExpiry = centre.api_key_generated_at ? 
    new Date(new Date(centre.api_key_generated_at).getTime() + 365 * 24 * 60 * 60 * 1000) : 
    null;

  const isKeyExpired = apiKeyExpiry && new Date() > apiKeyExpiry;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {integrations.map((integ, idx) => {
          const Icon = integ.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${
                integ.enabled
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${integ.color}`} />
                  <span className="font-medium text-sm">{integ.name}</span>
                </div>
                {integ.enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              {integ.count !== undefined && integ.enabled && (
                <p className="text-xs text-gray-600 mt-2">{integ.count} webhook(s) configuré(s)</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Détails API */}
      {fhirEnabled && (
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-indigo-900">Configuration FHIR</h4>
              <Badge className="bg-indigo-600 text-white">Actif</Badge>
            </div>
            {centre.fhir_endpoint && (
              <div className="text-xs space-y-1">
                <p className="text-gray-700">
                  <strong>Endpoint:</strong>{' '}
                  <code className="bg-white px-2 py-1 rounded text-indigo-600">
                    {centre.fhir_endpoint}
                  </code>
                </p>
              </div>
            )}
            {hasScopes && (
              <div className="text-xs space-y-1">
                <p className="text-gray-700 font-medium">Scopes autorisés:</p>
                <div className="flex flex-wrap gap-1">
                  {centre.api_scopes.slice(0, 5).map((scope, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-white">
                      {scope}
                    </Badge>
                  ))}
                  {centre.api_scopes.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{centre.api_scopes.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {isKeyExpired && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                ⚠️ La clé API a expiré. Veuillez la renouveler.
              </div>
            )}
          </div>
        </div>
      )}

      {!fhirEnabled && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Intégration FHIR désactivée</p>
              <p className="text-yellow-800 text-xs mt-1">
                Activez l'intégration FHIR pour permettre l'échange sécurisé de données médicales.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}