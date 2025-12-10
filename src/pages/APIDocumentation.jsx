import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Code,
  Copy,
  CheckCircle,
  Server,
  Lock,
  Key,
  BookOpen,
  Activity
} from 'lucide-react';

export default function APIDocumentation() {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = window.location.origin;

  const endpoints = {
    clinique: [
      {
        id: 'stats',
        method: 'POST',
        path: '/functions/apiClinique',
        description: 'Statistiques de la clinique',
        auth: 'OAuth (Utilisateur professionnel)',
        body: {
          endpoint: 'stats',
          clinique_id: 'optional'
        },
        response: {
          clinique: { nom: 'string', type: 'string' },
          professionnels: { total: 'number', par_specialite: 'object' },
          rendez_vous: { total: 'number', actifs: 'number' }
        }
      },
      {
        id: 'patients',
        method: 'POST',
        path: '/functions/apiClinique',
        description: 'Liste des patients suivis',
        auth: 'OAuth (Utilisateur professionnel)',
        body: {
          endpoint: 'patients',
          clinique_id: 'optional'
        },
        response: {
          total: 'number',
          patients: [{ id: 'string', prenom: 'string', vaccins: 'number' }]
        }
      },
      {
        id: 'rdv',
        method: 'POST',
        path: '/functions/apiClinique',
        description: 'Rendez-vous de la période',
        auth: 'OAuth (Utilisateur professionnel)',
        body: {
          endpoint: 'rendez-vous',
          date_debut: '2025-01-01',
          date_fin: '2025-12-31'
        },
        response: {
          total: 'number',
          rendez_vous: [{ id: 'string', date: 'datetime', statut: 'string' }]
        }
      }
    ],
    public: [
      {
        id: 'stats-region',
        method: 'POST',
        path: '/functions/apiPublic',
        description: 'Statistiques par région (MSP)',
        auth: 'API Key',
        headers: {
          'X-API-Key': 'your_api_key'
        },
        body: {
          endpoint: 'statistiques-region',
          region: 'Abidjan'
        },
        response: {
          region: 'string',
          statistiques: {
            professionnels_sante: 'number',
            utilisatrices_actives: 'number',
            grossesses_en_cours: 'number'
          }
        }
      },
      {
        id: 'verification',
        method: 'POST',
        path: '/functions/apiPublic',
        description: 'Vérifier accréditation professionnel',
        auth: 'API Key',
        headers: {
          'X-API-Key': 'your_api_key'
        },
        body: {
          endpoint: 'verification-professionnel',
          numero_ordre: '12345'
        },
        response: {
          verifie: 'boolean',
          professionnel: { nom: 'string', specialite: 'string' }
        }
      }
    ]
  };

  const CodeBlock = ({ code, id }) => (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{JSON.stringify(code, null, 2)}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 text-white hover:bg-gray-800"
        onClick={() => copyToClipboard(JSON.stringify(code, null, 2), id)}
      >
        {copiedEndpoint === id ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-xl border-none bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Server className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">API A'lo Maman</h1>
                <p className="text-teal-100">Documentation pour intégrations B2B cliniques et partenaires</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-white/20 text-white">v1.0</Badge>
              <Badge className="bg-white/20 text-white">REST API</Badge>
              <Badge className="bg-white/20 text-white">JSON</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              Authentification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2">API Clinique (OAuth)</p>
                  <p className="text-sm text-amber-800">
                    Authentification via compte professionnel A'lo Maman. L'utilisateur doit être connecté et avoir un profil professionnel.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">API Publique (API Key)</p>
                  <p className="text-sm text-blue-800 mb-2">
                    Pour services externes (MSP, Assurances). Nécessite une clé API.
                  </p>
                  <p className="text-xs text-blue-700 font-mono bg-white p-2 rounded">
                    X-API-Key: your_api_key_here
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="clinique">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clinique">
              <Server className="w-4 h-4 mr-2" />
              API Clinique
            </TabsTrigger>
            <TabsTrigger value="public">
              <Globe className="w-4 h-4 mr-2" />
              API Publique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clinique" className="space-y-4">
            {endpoints.clinique.map((endpoint) => (
              <Card key={endpoint.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-teal-600" />
                      {endpoint.description}
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-800">
                      {endpoint.method}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{baseUrl}{endpoint.path}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2 text-sm">Corps de la requête :</p>
                    <CodeBlock code={endpoint.body} id={`${endpoint.id}-body`} />
                  </div>
                  <div>
                    <p className="font-semibold mb-2 text-sm">Réponse :</p>
                    <CodeBlock code={endpoint.response} id={`${endpoint.id}-response`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="public" className="space-y-4">
            {endpoints.public.map((endpoint) => (
              <Card key={endpoint.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-600" />
                      {endpoint.description}
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-800">
                      {endpoint.method}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{baseUrl}{endpoint.path}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {endpoint.headers && (
                    <div>
                      <p className="font-semibold mb-2 text-sm">Headers :</p>
                      <CodeBlock code={endpoint.headers} id={`${endpoint.id}-headers`} />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold mb-2 text-sm">Corps de la requête :</p>
                    <CodeBlock code={endpoint.body} id={`${endpoint.id}-body`} />
                  </div>
                  <div>
                    <p className="font-semibold mb-2 text-sm">Réponse :</p>
                    <CodeBlock code={endpoint.response} id={`${endpoint.id}-response`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Exemple d'utilisation */}
        <Card className="shadow-lg border-2 border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Exemple d'utilisation (JavaScript)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`// API Clinique (authentifié)
const response = await fetch('${baseUrl}/functions/apiClinique', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: 'stats',
    clinique_id: 'abc123'
  })
});
const data = await response.json();

// API Publique (avec clé)
const response2 = await fetch('${baseUrl}/functions/apiPublic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    endpoint: 'statistiques-region',
    region: 'Abidjan'
  })
});
const data2 = await response2.json();`}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 text-white hover:bg-gray-800"
                onClick={() => copyToClipboard(`// Exemples d'utilisation des APIs A'lo Maman`, 'example-code')}
              >
                {copiedEndpoint === 'example-code' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 mb-2">Notes importantes</p>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Toutes les réponses sont au format JSON</li>
                  <li>• Les erreurs retournent un objet {`{ error: "message" }`}</li>
                  <li>• L'API Clinique nécessite une authentification utilisateur active</li>
                  <li>• L'API Publique nécessite une clé API (contactez l'administration)</li>
                  <li>• Rate limit: 100 requêtes/minute par utilisateur/clé</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}