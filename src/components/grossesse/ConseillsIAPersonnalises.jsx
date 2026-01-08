import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, Apple, Zap, Heart, Moon } from 'lucide-react';
import { differenceInWeeks } from 'date-fns';

const CATEGORIES_CONSEILS = {
  nutrition: { icon: Apple, label: 'Nutrition', color: 'text-green-600' },
  activite: { icon: Zap, label: 'Activité', color: 'text-blue-600' },
  bien_etre: { icon: Heart, label: 'Bien-être', color: 'text-pink-600' },
  sommeil: { icon: Moon, label: 'Sommeil', color: 'text-purple-600' },
};

export default function ConseillsIAPersonnalises({ grossesse, profilMaman }) {
  const queryClient = useQueryClient();
  const [selectedCategorie, setSelectedCategorie] = useState('nutrition');

  const genererConseilsMutation = useMutation({
    mutationFn: async () => {
      const semaine = differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle));
      const trimestre = semaine < 13 ? '1er' : semaine < 27 ? '2e' : '3e';
      
      const prompt = `Tu es une experte en santé maternelle. Génère des conseils pratiques et personnalisés pour une maman enceinte.

CONTEXTE:
- Semaine de grossesse: ${semaine}/40 (${trimestre} trimestre)
- Type de grossesse: ${grossesse.type_grossesse}
- Allergies: ${profilMaman?.allergies?.join(', ') || 'Aucune'}
- Antécédents: ${profilMaman?.maladies_chroniques?.join(', ') || 'Aucun'}

Génère 4 conseils pour CHAQUE catégorie (nutrition, activite, bien_etre, sommeil), adaptés à la semaine ${semaine}.

Pour chaque conseil:
- Sois spécifique et actionnable
- Tiens compte du trimestre
- Mentionne les bénéfices pour maman et bébé
- Ajoute des précautions si nécessaire

Retourne un JSON:
{
  "nutrition": ["conseil1", "conseil2", "conseil3", "conseil4"],
  "activite": ["conseil1", "conseil2", "conseil3", "conseil4"],
  "bien_etre": ["conseil1", "conseil2", "conseil3", "conseil4"],
  "sommeil": ["conseil1", "conseil2", "conseil3", "conseil4"],
  "resume": "Résumé d'1 phrase sur l'état idéal cette semaine"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            nutrition: { type: 'array', items: { type: 'string' } },
            activite: { type: 'array', items: { type: 'string' } },
            bien_etre: { type: 'array', items: { type: 'string' } },
            sommeil: { type: 'array', items: { type: 'string' } },
            resume: { type: 'string' }
          }
        }
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conseils_ia'] });
    }
  });

  if (!grossesse || !genererConseilsMutation.data) {
    return (
      <Card className="shadow-lg border-none bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Conseils personnalisés par l'IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => genererConseilsMutation.mutate()}
            disabled={genererConseilsMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {genererConseilsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération des conseils...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4 mr-2" />
                Générer mes conseils personnalisés
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const conseils = genererConseilsMutation.data;
  const Icon = CATEGORIES_CONSEILS[selectedCategorie].icon;

  return (
    <Card className="shadow-lg border-none bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Conseils personnalisés
        </CardTitle>
        {conseils.resume && (
          <p className="text-sm text-gray-700 mt-2 font-medium">{conseils.resume}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélecteur de catégories */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES_CONSEILS).map(([cat, config]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategorie(cat)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                selectedCategorie === cat
                  ? 'bg-white shadow-md'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            >
              <config.icon className={`w-4 h-4 ${config.color}`} />
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          ))}
        </div>

        {/* Conseils */}
        <div className="space-y-3">
          {conseils[selectedCategorie]?.map((conseil, idx) => (
            <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-700">{idx + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{conseil}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => genererConseilsMutation.mutate()}
          disabled={genererConseilsMutation.isPending}
          variant="outline"
          className="w-full"
        >
          {genererConseilsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Régénération...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              Générer de nouveaux conseils
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}