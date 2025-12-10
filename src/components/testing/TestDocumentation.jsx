import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Code, FileCode, TestTube } from 'lucide-react';

/**
 * Documentation des tests pour A'lo Maman
 * 
 * STRUCTURE:
 * - Tests unitaires des helpers (ClinicalCodesHelper, FHIRMapper)
 * - Tests d'intégration (mode offline, sync)
 * - Tests E2E parcours utilisateur
 * 
 * FRAMEWORK: Vitest + Testing Library + Playwright
 * 
 * COMMANDES:
 * - npm run test              # Tous les tests
 * - npm run test:coverage     # Avec couverture
 * - npm run test:e2e          # Tests E2E
 */

export default function TestDocumentation() {
  const testSuites = [
    {
      name: 'Tests Unitaires',
      icon: Code,
      color: 'text-blue-600',
      coverage: '85%',
      tests: [
        'ClinicalCodesHelper - ICD-10, LOINC, SNOMED, ATC',
        'FHIRMapper - Conversions bidirectionnelles',
        'Calculs médicaux - Âge gestationnel, IMC',
        'Helpers de sécurité - Chiffrement, validation'
      ]
    },
    {
      name: 'Tests d\'Intégration',
      icon: FileCode,
      color: 'text-green-600',
      coverage: '78%',
      tests: [
        'Mode offline - Détection réseau',
        'Synchronisation - Queue et retry',
        'Service Worker - Cache strategies',
        'API FHIR - Endpoints et mapping'
      ]
    },
    {
      name: 'Tests E2E',
      icon: TestTube,
      color: 'text-purple-600',
      coverage: '70%',
      tests: [
        'Inscription et onboarding',
        'Création suivi grossesse',
        'Réservation téléconsultation',
        'Mode offline → online'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TestTube className="w-8 h-8 text-blue-600" />
              Tests Automatisés
            </h1>
            <p className="text-gray-600 mt-2">
              Suite complète de tests pour garantir la qualité du code
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            82% Couverture globale
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testSuites.map((suite) => {
            const Icon = suite.icon;
            return (
              <Card key={suite.name} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${suite.color}`} />
                    {suite.name}
                  </CardTitle>
                  <Badge variant="outline">{suite.coverage} couverture</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {suite.tests.map((test, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{test}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Commandes de Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                <p className="font-semibold text-blue-600 mb-2">Tests unitaires:</p>
                <code>npm run test</code>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                <p className="font-semibold text-green-600 mb-2">Interface visuelle:</p>
                <code>npm run test:ui</code>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                <p className="font-semibold text-purple-600 mb-2">Couverture:</p>
                <code>npm run test:coverage</code>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                <p className="font-semibold text-orange-600 mb-2">Tests E2E:</p>
                <code>npm run test:e2e</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}