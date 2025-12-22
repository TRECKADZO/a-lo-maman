import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Baby, Heart, Stethoscope, AlertCircle, Lightbulb, 
  Activity, Apple, Pill, Coffee, Dumbbell, ArrowLeft,
  ChevronRight, Clock, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContenuTrimestre({ trimestre, onRetour, currentWeek }) {
  const [selectedWeek, setSelectedWeek] = useState(null);

  const contenuParTrimestre = {
    1: {
      titre: '1er Trimestre',
      semaines: '0 à 14 semaines',
      description: 'La période de formation de l\'embryon puis du fœtus',
      color: 'pink',
      sections: {
        developpement: {
          titre: 'Développement de bébé',
          icon: Baby,
          contenu: [
            {
              semaine: 4,
              titre: 'Semaine 4 : Le début',
              description: 'L\'embryon mesure 2 mm. Le cœur commence à battre.',
              details: 'Les cellules se divisent rapidement pour former les différentes parties du corps.'
            },
            {
              semaine: 8,
              titre: 'Semaine 8 : Prend forme',
              description: 'L\'embryon mesure 1,5 cm. Les organes principaux se forment.',
              details: 'Les bras et jambes commencent à apparaître. Le visage prend forme.'
            },
            {
              semaine: 12,
              titre: 'Semaine 12 : Fœtus',
              description: 'Le fœtus mesure 5,4 cm. Tous les organes sont formés.',
              details: 'Les doigts et orteils sont séparés. Il peut sucer son pouce.'
            }
          ]
        },
        symptomes: {
          titre: 'Changements physiques & symptômes',
          icon: Activity,
          points: [
            { titre: 'Nausées matinales', description: 'Fréquentes surtout le matin, peuvent durer toute la journée', conseil: 'Mangez de petites portions régulièrement' },
            { titre: 'Fatigue intense', description: 'Votre corps travaille dur pour créer le placenta', conseil: 'Reposez-vous dès que possible' },
            { titre: 'Seins sensibles', description: 'Ils se préparent à l\'allaitement', conseil: 'Portez un soutien-gorge confortable' },
            { titre: 'Envies fréquentes d\'uriner', description: 'L\'utérus appuie sur la vessie', conseil: 'Évitez les boissons avant de dormir' },
            { titre: 'Sautes d\'humeur', description: 'Les hormones fluctuent beaucoup', conseil: 'C\'est normal, parlez-en à vos proches' }
          ]
        },
        alertes: {
          titre: 'Quand s\'inquiéter ?',
          icon: AlertCircle,
          points: [
            { titre: 'Saignements importants', gravite: 'urgence' },
            { titre: 'Douleurs abdominales sévères', gravite: 'urgence' },
            { titre: 'Fièvre supérieure à 38°C', gravite: 'attention' },
            { titre: 'Vomissements excessifs', gravite: 'attention' },
            { titre: 'Perte de liquide', gravite: 'urgence' }
          ]
        },
        quotidien: {
          titre: 'Vie quotidienne',
          icon: Lightbulb,
          categories: [
            {
              titre: 'Alimentation',
              icon: Apple,
              conseils: [
                'Évitez les fromages au lait cru',
                'Pas de viande ou poisson cru',
                'Lavez bien les fruits et légumes',
                'Prenez de l\'acide folique',
                'Mangez équilibré et varié'
              ]
            },
            {
              titre: 'Boissons',
              icon: Coffee,
              conseils: [
                'Limitez le café (max 200mg/jour)',
                'Évitez l\'alcool complètement',
                'Buvez beaucoup d\'eau (1,5-2L/jour)',
                'Attention aux tisanes (certaines déconseillées)',
                'Préférez l\'eau plate ou gazeuse'
              ]
            },
            {
              titre: 'Activité physique',
              icon: Dumbbell,
              conseils: [
                'Marche quotidienne recommandée',
                'Natation excellente pour le dos',
                'Yoga prénatal bénéfique',
                'Évitez les sports à risque de chute',
                'Écoutez votre corps'
              ]
            },
            {
              titre: 'Médicaments',
              icon: Pill,
              conseils: [
                'Consultez toujours avant de prendre un médicament',
                'Le paracétamol est généralement sûr',
                'Évitez l\'ibuprofène',
                'Attention aux produits naturels',
                'Gardez une liste de ce que vous prenez'
              ]
            }
          ]
        },
        examens: {
          titre: 'Examens & Rendez-vous',
          icon: Stethoscope,
          rdv: [
            { semaine: '6-8', titre: 'Première consultation', description: 'Confirmation de la grossesse, prescription des examens' },
            { semaine: '12', titre: 'Échographie de datation', description: 'Vérification de la date, mesure de la clarté nucale' },
            { semaine: '11-13', titre: 'Dépistage trisomie 21', description: 'Prise de sang + échographie (optionnel)' }
          ]
        }
      }
    },
    2: {
      titre: '2e Trimestre',
      semaines: '15 à 28 semaines',
      description: 'La période la plus confortable, bébé grandit rapidement',
      color: 'purple',
      sections: {
        developpement: {
          titre: 'Développement de bébé',
          icon: Baby,
          contenu: [
            {
              semaine: 16,
              titre: 'Semaine 16 : Il bouge !',
              description: 'Le fœtus mesure 11 cm et pèse 100g. Vous pourriez sentir ses premiers mouvements.',
              details: 'Les traits du visage sont plus définis. Il peut faire des grimaces.'
            },
            {
              semaine: 20,
              titre: 'Semaine 20 : Mi-parcours',
              description: 'Le fœtus mesure 16 cm et pèse 300g. C\'est l\'échographie morphologique.',
              details: 'Tous les organes sont en place. On peut déterminer le sexe.'
            },
            {
              semaine: 24,
              titre: 'Semaine 24 : Il entend',
              description: 'Le fœtus mesure 21 cm et pèse 600g. Il réagit aux sons extérieurs.',
              details: 'Les poumons se développent. Il a des cycles de sommeil.'
            },
            {
              semaine: 28,
              titre: 'Semaine 28 : Les yeux s\'ouvrent',
              description: 'Le fœtus mesure 25 cm et pèse 1 kg. Il ouvre les yeux.',
              details: 'Le cerveau se développe rapidement. Il suce son pouce.'
            }
          ]
        },
        symptomes: {
          titre: 'Changements physiques',
          icon: Activity,
          points: [
            { titre: 'Ventre qui s\'arrondit', description: 'C\'est visible maintenant !', conseil: 'Hydratez votre peau' },
            { titre: 'Mouvements de bébé', description: 'Vous les sentez de plus en plus', conseil: 'Notez les moments d\'activité' },
            { titre: 'Essoufflement', description: 'L\'utérus comprime le diaphragme', conseil: 'Prenez votre temps' },
            { titre: 'Maux de dos', description: 'Le poids du ventre tire sur le dos', conseil: 'Faites des étirements' },
            { titre: 'Plus d\'énergie', description: 'Le trimestre le plus agréable !', conseil: 'Profitez-en' }
          ]
        },
        alertes: {
          titre: 'Vigilance',
          icon: AlertCircle,
          points: [
            { titre: 'Contractions régulières', gravite: 'urgence' },
            { titre: 'Saignements', gravite: 'urgence' },
            { titre: 'Absence de mouvements de bébé', gravite: 'attention' },
            { titre: 'Vision floue ou maux de tête sévères', gravite: 'attention' },
            { titre: 'Gonflement soudain des mains/pieds', gravite: 'attention' }
          ]
        },
        quotidien: {
          titre: 'Bien-être',
          icon: Lightbulb,
          categories: [
            {
              titre: 'Nutrition',
              icon: Apple,
              conseils: [
                'Augmentez les protéines',
                'Fer et calcium essentiels',
                'Oméga-3 pour le cerveau de bébé',
                'Fractionnez les repas',
                'Collations saines'
              ]
            },
            {
              titre: 'Préparation',
              icon: Baby,
              conseils: [
                'Pensez au prénom',
                'Préparez la chambre',
                'Cours de préparation à l\'accouchement',
                'Choisissez le lieu d\'accouchement',
                'Projet de naissance'
              ]
            }
          ]
        },
        examens: {
          titre: 'Suivi médical',
          icon: Stethoscope,
          rdv: [
            { semaine: '16-18', titre: 'Consultation mensuelle', description: 'Contrôle tension, poids, urine' },
            { semaine: '20-22', titre: 'Échographie morphologique', description: 'Examen détaillé de tous les organes' },
            { semaine: '24-28', titre: 'Dépistage diabète gestationnel', description: 'Test O\'Sullivan (optionnel mais recommandé)' }
          ]
        }
      }
    },
    3: {
      titre: '3e Trimestre',
      semaines: '29 à 40 semaines',
      description: 'Les dernières semaines, bébé prend du poids et se positionne',
      color: 'blue',
      sections: {
        developpement: {
          titre: 'Bébé se prépare',
          icon: Baby,
          contenu: [
            {
              semaine: 30,
              titre: 'Semaine 30 : Yeux ouverts',
              description: 'Il garde les yeux ouverts. Il voit de 20 à 30 cm devant lui.',
              details: 'Les organes sont presque tous formés. Il perçoit les voix.'
            },
            {
              semaine: 32,
              titre: 'Semaine 32 : Il gigote',
              description: 'Il mesure 28 cm et pèse 1,7 kg. Il fait de grands mouvements.',
              details: 'Son cœur bat à 135-140 battements/min. Prise de poids rapide.'
            },
            {
              semaine: 36,
              titre: 'Semaine 36 : Entraînement',
              description: 'Il mesure 32 cm et pèse 2,5 kg. Il s\'entraîne à respirer.',
              details: 'Les poumons sont presque prêts. Il a moins de place.'
            },
            {
              semaine: 40,
              titre: 'Semaine 40 : Bientôt là !',
              description: 'Il mesure 35 cm et pèse 3-4 kg. Il est prêt à naître.',
              details: 'Il attend patiemment. Tous les organes sont matures.'
            }
          ]
        },
        symptomes: {
          titre: 'Dernières semaines',
          icon: Activity,
          points: [
            { titre: 'Contractions de Braxton Hicks', description: 'Entraînement de l\'utérus', conseil: 'Normales si irrégulières' },
            { titre: 'Fatigue importante', description: 'Le poids de bébé se fait sentir', conseil: 'Repos régulier' },
            { titre: 'Essoufflement marqué', description: 'Bébé comprime les poumons', conseil: 'Respirez profondément' },
            { titre: 'Difficultés à dormir', description: 'Inconfort et anxiété', conseil: 'Coussin de grossesse' },
            { titre: 'Envie fréquente d\'uriner', description: 'Tête de bébé sur vessie', conseil: 'C\'est bientôt fini !' }
          ]
        },
        alertes: {
          titre: 'Signes d\'accouchement',
          icon: AlertCircle,
          points: [
            { titre: 'Perte des eaux', gravite: 'urgence' },
            { titre: 'Contractions régulières rapprochées', gravite: 'urgence' },
            { titre: 'Saignements', gravite: 'urgence' },
            { titre: 'Diminution mouvements bébé', gravite: 'attention' },
            { titre: 'Perte du bouchon muqueux', gravite: 'info' }
          ]
        },
        quotidien: {
          titre: 'Préparation finale',
          icon: Lightbulb,
          categories: [
            {
              titre: 'Valise maternité',
              icon: Baby,
              conseils: [
                'Vêtements confortables pour vous',
                'Bodies et pyjamas pour bébé',
                'Produits de toilette',
                'Documents administratifs',
                'Chargeurs de téléphone'
              ]
            },
            {
              titre: 'À la maison',
              icon: Activity,
              conseils: [
                'Chambre de bébé prête',
                'Stock de couches',
                'Matériel allaitement/biberons',
                'Siège auto installé',
                'Numéros d\'urgence affichés'
              ]
            }
          ]
        },
        examens: {
          titre: 'Rendez-vous',
          icon: Stethoscope,
          rdv: [
            { semaine: '32', titre: '3e échographie', description: 'Vérification croissance et position' },
            { semaine: '36', titre: 'Consultation anesthésiste', description: 'Si vous souhaitez la péridurale' },
            { semaine: '37-40', titre: 'Consultations hebdomadaires', description: 'Suivi rapproché jusqu\'à l\'accouchement' },
            { semaine: '41', titre: 'Déclenchement possible', description: 'Si bébé tarde à venir' }
          ]
        }
      }
    }
  };

  const data = contenuParTrimestre[trimestre];
  if (!data) return null;

  const colorClasses = {
    pink: {
      gradient: 'from-pink-400 to-rose-500',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      badge: 'bg-pink-100 text-pink-800'
    },
    purple: {
      gradient: 'from-purple-400 to-indigo-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800'
    },
    blue: {
      gradient: 'from-blue-400 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800'
    }
  };

  const colors = colorClasses[data.color];

  return (
    <div className="space-y-6">
      {/* Header avec retour */}
      <div>
        <Button 
          variant="ghost" 
          onClick={onRetour}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux trimestres
        </Button>

        <div className={`${colors.bg} rounded-2xl p-6`}>
          <Badge className={colors.badge}>
            {data.semaines}
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 mb-1">
            {data.titre}
          </h2>
          <p className="text-gray-600">{data.description}</p>
        </div>
      </div>

      {/* Tabs de contenu */}
      <Tabs defaultValue="developpement" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="developpement">Développement</TabsTrigger>
          <TabsTrigger value="symptomes">Symptômes</TabsTrigger>
          <TabsTrigger value="quotidien">Quotidien</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="examens">Examens</TabsTrigger>
        </TabsList>

        {/* Développement */}
        <TabsContent value="developpement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className={`w-5 h-5 ${colors.text}`} />
                {data.sections.developpement.titre}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.sections.developpement.contenu.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={selectedWeek === item.semaine ? 'ring-2 ring-pink-500' : ''}>
                    <CardContent className="p-4">
                      <div 
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => setSelectedWeek(selectedWeek === item.semaine ? null : item.semaine)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={colors.badge}>
                              Semaine {item.semaine}
                            </Badge>
                            {currentWeek === item.semaine && (
                              <Badge className="bg-green-100 text-green-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Vous y êtes
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{item.titre}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          
                          <AnimatePresence>
                            {selectedWeek === item.semaine && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t"
                              >
                                <p className="text-sm text-gray-700">{item.details}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedWeek === item.semaine ? 'rotate-90' : ''}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Symptômes */}
        <TabsContent value="symptomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${colors.text}`} />
                {data.sections.symptomes.titre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {data.sections.symptomes.points.map((symptome, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg ${colors.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{symptome.titre}</h4>
                        <p className="text-sm text-gray-600 mb-2">{symptome.description}</p>
                        <p className="text-xs text-gray-500 italic">💡 {symptome.conseil}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotidien */}
        <TabsContent value="quotidien" className="space-y-4">
          {data.sections.quotidien.categories.map((categorie, index) => {
            const Icon = categorie.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                    {categorie.titre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {categorie.conseils.map((conseil, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <ChevronRight className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                        <span>{conseil}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Alertes */}
        <TabsContent value="alertes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {data.sections.alertes.titre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.sections.alertes.points.map((alerte, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      alerte.gravite === 'urgence' 
                        ? 'bg-red-50 border-red-500' 
                        : alerte.gravite === 'attention'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {alerte.gravite === 'urgence' && (
                        <Badge className="bg-red-100 text-red-800">Urgence</Badge>
                      )}
                      {alerte.gravite === 'attention' && (
                        <Badge className="bg-orange-100 text-orange-800">Attention</Badge>
                      )}
                      {alerte.gravite === 'info' && (
                        <Badge className="bg-blue-100 text-blue-800">Info</Badge>
                      )}
                      <span className="font-medium">{alerte.titre}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>En cas de doute :</strong> Contactez toujours votre sage-femme, 
                    gynécologue ou les urgences maternité. Il vaut mieux consulter pour rien 
                    que de prendre un risque.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examens */}
        <TabsContent value="examens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className={`w-5 h-5 ${colors.text}`} />
                {data.sections.examens.titre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.sections.examens.rdv.map((rdv, index) => (
                  <div key={index} className={`p-4 rounded-lg ${colors.bg}`}>
                    <div className="flex items-start gap-3">
                      <Badge className={colors.badge}>
                        Semaine {rdv.semaine}
                      </Badge>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{rdv.titre}</h4>
                        <p className="text-sm text-gray-600">{rdv.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}