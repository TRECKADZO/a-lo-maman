import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, Loader2, Sparkles, Moon, Sun, Coffee, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ConseilsSommeil({ entries }) {
  const [conseils, setConseils] = useState(null);

  const genererConseilsMutation = useMutation({
    mutationFn: async () => {
      // Analyser les données
      const moyenneDuree = entries.length > 0
        ? (entries.reduce((acc, e) => acc + e.duree_heures, 0) / entries.length).toFixed(1)
        : 0;

      const moyenneReveils = entries.length > 0
        ? (entries.reduce((acc, e) => acc + (e.nombre_reveils || 0), 0) / entries.length).toFixed(1)
        : 0;

      const facteurs = {};
      entries.forEach(e => {
        (e.facteurs_perturbateurs || []).forEach(f => {
          facteurs[f] = (facteurs[f] || 0) + 1;
        });
      });

      const topFacteur = Object.entries(facteurs).sort((a, b) => b[1] - a[1])[0]?.[0];

      const difficultes = entries.filter(e => e.difficulte_endormissement).length;
      const pourcentageDifficultes = entries.length > 0 ? ((difficultes / entries.length) * 100).toFixed(0) : 0;

      const qualiteMoyenne = entries.length > 0
        ? entries.reduce((acc, e) => {
            const scores = { très_mauvaise: 1, mauvaise: 2, moyenne: 3, bonne: 4, excellente: 5 };
            return acc + (scores[e.qualite] || 3);
          }, 0) / entries.length
        : 0;

      // Générer conseils via IA
      const prompt = `En tant qu'expert en sommeil, analyse ces données et donne des conseils personnalisés en français:

Données sur ${entries.length} nuits:
- Durée moyenne: ${moyenneDuree}h
- Réveils nocturnes moyens: ${moyenneReveils}
- Qualité moyenne: ${qualiteMoyenne.toFixed(1)}/5
- Facteur perturbateur principal: ${topFacteur || 'aucun'}
- Difficultés à s'endormir: ${pourcentageDifficultes}% des nuits

Donne 5 conseils concrets et actionnables pour améliorer le sommeil.
Format: JSON avec {conseils: [{titre, description, priorite: "haute/moyenne/basse", icone: "moon/sun/coffee/smartphone"}]}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            conseils: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  titre: { type: 'string' },
                  description: { type: 'string' },
                  priorite: { type: 'string' },
                  icone: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setConseils(data);
    }
  });

  const getIcon = (iconeName) => {
    const icons = {
      moon: Moon,
      sun: Sun,
      coffee: Coffee,
      smartphone: Smartphone
    };
    return icons[iconeName] || Lightbulb;
  };

  const getPrioriteColor = (priorite) => {
    if (priorite === 'haute') return 'bg-red-100 text-red-800';
    if (priorite === 'moyenne') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (entries.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Enregistrez au moins 3 nuits pour obtenir des conseils personnalisés</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Conseils personnalisés par IA</h3>
              <p className="text-gray-700 mb-4">
                Basés sur l'analyse de vos {entries.length} dernières nuits, notre IA vous propose des recommandations adaptées à votre situation.
              </p>
              <Button
                onClick={() => genererConseilsMutation.mutate()}
                disabled={genererConseilsMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {genererConseilsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer mes conseils
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {conseils?.conseils && (
        <div className="space-y-4">
          {conseils.conseils.map((conseil, idx) => {
            const Icon = getIcon(conseil.icone);
            return (
              <Card key={idx} className="shadow-lg border-none hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-lg">{conseil.titre}</h4>
                        <Badge className={getPrioriteColor(conseil.priorite)}>
                          {conseil.priorite}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{conseil.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Conseils généraux toujours affichés */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Règles d'hygiène du sommeil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-900">
              ☀️ <strong>Exposition à la lumière :</strong> Exposez-vous à la lumière naturelle le matin et évitez les écrans 1h avant le coucher
            </AlertDescription>
          </Alert>
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-sm text-green-900">
              🏃‍♀️ <strong>Activité physique :</strong> Faites de l'exercice régulièrement, mais évitez les séances intenses le soir
            </AlertDescription>
          </Alert>
          <Alert className="bg-purple-50 border-purple-200">
            <AlertDescription className="text-sm text-purple-900">
              🍽️ <strong>Alimentation :</strong> Évitez les repas lourds, la caféine et l'alcool avant le coucher
            </AlertDescription>
          </Alert>
          <Alert className="bg-indigo-50 border-indigo-200">
            <AlertDescription className="text-sm text-indigo-900">
              🛏️ <strong>Environnement :</strong> Maintenez votre chambre fraîche (18-19°C), calme et sombre
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}