import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart, Baby, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConseilsPersonnalisesIA({ context, profilMaman, grossesse, enfants }) {
  const queryClient = useQueryClient();

  const genererConseils = useMutation({
    mutationFn: async () => {
      const contextData = {
        has_grossesse: !!grossesse,
        semaine_grossesse: grossesse ? Math.floor((Date.now() - new Date(grossesse.date_derniere_regle)) / 604800000) : null,
        trimestre: grossesse ? (Math.floor((Date.now() - new Date(grossesse.date_derniere_regle)) / 604800000) <= 13 ? 1 : Math.floor((Date.now() - new Date(grossesse.date_derniere_regle)) / 604800000) <= 26 ? 2 : 3) : null,
        nombre_enfants: enfants?.length || 0,
        age_plus_jeune: enfants?.[0] ? Math.floor((Date.now() - new Date(enfants[0].date_naissance)) / (30.44 * 86400000)) : null,
        ville: profilMaman?.ville,
        derniere_consultation: grossesse?.consultations?.[grossesse.consultations.length - 1]
      };

      const prompt = `En tant qu'assistant santé spécialisé en maternité et petite enfance en Côte d'Ivoire, génère 3-5 conseils personnalisés pour une utilisatrice avec le profil suivant:

${contextData.has_grossesse ? `- Enceinte: ${contextData.semaine_grossesse}SA (Trimestre ${contextData.trimestre})` : ''}
${contextData.nombre_enfants > 0 ? `- ${contextData.nombre_enfants} enfant(s)` : ''}
${contextData.age_plus_jeune ? `- Plus jeune: ${contextData.age_plus_jeune} mois` : ''}
- Ville: ${contextData.ville || 'Non spécifié'}

Fournir des conseils:
1. Pratiques et applicables au contexte ivoirien
2. Adaptés à la période actuelle (trimestre/âge enfant)
3. Avec des actions concrètes
4. Tenant compte du climat et des ressources locales

Format pour chaque conseil:
- Titre court
- Type (nutrition/sante/activite/emotionnel)
- Contenu détaillé
- Priorité (haute/moyenne/basse)`;

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
                  type: { type: 'string' },
                  contenu: { type: 'string' },
                  priorite: { type: 'string' },
                  icone: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return response.conseils;
    }
  });

  const { data: conseils, isLoading } = useQuery({
    queryKey: ['conseils_ia', profilMaman?.id, grossesse?.id, enfants?.length],
    queryFn: () => genererConseils.mutateAsync(),
    staleTime: 3600000, // 1 heure
    enabled: !!profilMaman
  });

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'nutrition': return 'bg-green-100 text-green-800';
      case 'sante': return 'bg-red-100 text-red-800';
      case 'activite': return 'bg-blue-100 text-blue-800';
      case 'emotionnel': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priorite) => {
    switch (priorite?.toLowerCase()) {
      case 'haute': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'moyenne': return <Heart className="w-5 h-5 text-orange-600" />;
      default: return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  if (!profilMaman) return null;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Conseils Personnalisés IA
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['conseils_ia'] });
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Génération de vos conseils personnalisés...</p>
          </div>
        ) : conseils?.length > 0 ? (
          <div className="space-y-3">
            {conseils.map((conseil, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getPriorityIcon(conseil.priorite)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{conseil.titre}</h3>
                          <Badge className={getTypeColor(conseil.type)}>
                            {conseil.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {conseil.contenu}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Baby className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Complétez votre profil pour recevoir des conseils personnalisés
            </p>
          </div>
        )}

        <div className="p-3 bg-white/50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            💡 Ces conseils sont générés par IA et adaptés à votre situation. Consultez toujours un professionnel de santé pour un avis médical.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}