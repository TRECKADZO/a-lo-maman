import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Baby, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConseilsPersonnalises({ profil, grossesse, enfants }) {
  const [conseils, setConseils] = useState(null);
  const [loading, setLoading] = useState(false);

  const genererConseils = useMutation({
    mutationFn: async () => {
      // Construire le contexte utilisateur
      let contexte = `Profil: Femme`;
      
      if (profil) {
        const age = Math.floor((Date.now() - new Date(profil.date_naissance)) / 31557600000);
        contexte += `, ${age} ans, ${profil.ville}`;
      }
      
      if (grossesse?.grossesse_active) {
        const semaine = Math.floor((Date.now() - new Date(grossesse.date_derniere_regle)) / 604800000);
        const trimestre = semaine <= 13 ? 1 : semaine <= 27 ? 2 : 3;
        contexte += `\n\nGrossesse active: Semaine ${semaine}, Trimestre ${trimestre}`;
        
        if (grossesse.antecedents?.length > 0) {
          contexte += `\nAntécédents: ${grossesse.antecedents.join(', ')}`;
        }
        
        if (grossesse.consultations?.length > 0) {
          const derniere = grossesse.consultations[grossesse.consultations.length - 1];
          contexte += `\nDernière consultation: TA ${derniere.tension_arterielle}, Poids ${derniere.poids}kg`;
        }
      }
      
      if (enfants?.length > 0) {
        contexte += `\n\nEnfants: ${enfants.length}`;
        enfants.forEach((e, i) => {
          const ageMois = Math.floor((Date.now() - new Date(e.date_naissance)) / (30.44 * 86400000));
          contexte += `\n- Enfant ${i+1}: ${ageMois} mois`;
          
          if (e.vaccins?.length > 0) {
            const vaccinsDus = e.vaccins.filter(v => v.prochain_rappel && new Date(v.prochain_rappel) < new Date(Date.now() + 7 * 86400000));
            if (vaccinsDus.length > 0) {
              contexte += ` (${vaccinsDus.length} vaccin(s) à prévoir)`;
            }
          }
        });
      }

      const prompt = `Tu es un assistant IA spécialisé en santé maternelle et infantile en Côte d'Ivoire.

Contexte de la patiente:
${contexte}

Génère 4-6 conseils personnalisés couvrant:
1. Santé et suivi médical (priorité haute si grossesse)
2. Nutrition adaptée
3. Activité physique / repos
4. Bien-être mental
5. Soins enfants (si applicable)
6. Prévention et alertes

Pour chaque conseil:
- Titre concis
- Description claire et actionnable
- Niveau de priorité (haute/moyenne/basse)
- Catégorie (sante/nutrition/mental/enfant/prevention)
- Icône suggérée (heart/baby/activity/alert)`;

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
                  priorite: { 
                    type: 'string',
                    enum: ['haute', 'moyenne', 'basse']
                  },
                  categorie: {
                    type: 'string',
                    enum: ['sante', 'nutrition', 'mental', 'enfant', 'prevention']
                  },
                  icone: {
                    type: 'string',
                    enum: ['heart', 'baby', 'activity', 'alert']
                  }
                }
              }
            },
            message_motivation: { type: 'string' }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setConseils(data);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    }
  });

  const handleGenerer = () => {
    setLoading(true);
    genererConseils.mutate();
  };

  const getIcon = (icone) => {
    switch (icone) {
      case 'heart': return <Heart className="w-5 h-5" />;
      case 'baby': return <Baby className="w-5 h-5" />;
      case 'activity': return <Activity className="w-5 h-5" />;
      case 'alert': return <AlertCircle className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategorieColor = (categorie) => {
    switch (categorie) {
      case 'sante': return 'text-pink-600 bg-pink-50';
      case 'nutrition': return 'text-green-600 bg-green-50';
      case 'mental': return 'text-purple-600 bg-purple-50';
      case 'enfant': return 'text-blue-600 bg-blue-50';
      default: return 'text-orange-600 bg-orange-50';
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Conseils Personnalisés IA
          </CardTitle>
          <Button 
            onClick={handleGenerer}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Génération...' : 'Actualiser'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!conseils && !loading && (
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Obtenez des conseils santé personnalisés basés sur votre profil et votre situation
            </p>
            <Button 
              onClick={handleGenerer}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              Générer mes conseils
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">L'IA analyse votre profil...</p>
          </div>
        )}

        {conseils && (
          <AnimatePresence>
            <div className="space-y-4">
              {/* Message de motivation */}
              {conseils.message_motivation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg"
                >
                  <p className="text-purple-900 font-medium">{conseils.message_motivation}</p>
                </motion.div>
              )}

              {/* Conseils */}
              <div className="space-y-3">
                {conseils.conseils?.map((conseil, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`p-4 rounded-lg border-2 ${getCategorieColor(conseil.categorie)} border-opacity-30`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getCategorieColor(conseil.categorie)}`}>
                            {getIcon(conseil.icone)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{conseil.titre}</h3>
                          </div>
                        </div>
                        <Badge className={getPrioriteColor(conseil.priorite)}>
                          {conseil.priorite}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 ml-11">{conseil.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}