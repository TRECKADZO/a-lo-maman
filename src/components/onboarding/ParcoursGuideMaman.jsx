import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Baby, Calendar as CalendarIcon, Bell, 
  CheckCircle, ArrowRight, Sparkles, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ParcoursGuideMaman({ onComplete, userEmail }) {
  const [etape, setEtape] = useState(1);
  const [data, setData] = useState({
    nom_complet: '',
    date_naissance: null,
    ville: '',
    telephone: '',
    situation: '',
    est_enceinte: null,
    date_derniere_regle: null,
    a_enfants: null,
    interets: []
  });

  const queryClient = useQueryClient();

  const creerProfil = useMutation({
    mutationFn: async (profilData) => {
      // Créer le profil maman
      const profil = await base44.entities.ProfilMaman.create(profilData);
      
      // Si enceinte, créer le suivi grossesse
      if (profilData.date_derniere_regle) {
        const ddr = new Date(profilData.date_derniere_regle);
        const dpa = new Date(ddr);
        dpa.setDate(dpa.getDate() + 280);
        
        await base44.entities.SuiviGrossesse.create({
          date_derniere_regle: profilData.date_derniere_regle,
          date_accouchement_prevue: dpa.toISOString().split('T')[0],
          grossesse_active: true
        });
      }
      
      return profil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      toast.success('Profil créé avec succès !');
      onComplete();
    }
  });

  const etapes = [
    {
      numero: 1,
      titre: "Bienvenue sur A'lo Maman !",
      soustitre: "Créons ensemble votre profil santé",
      icon: Heart,
      color: 'text-pink-500'
    },
    {
      numero: 2,
      titre: "Vos informations personnelles",
      soustitre: "Pour mieux vous accompagner",
      icon: Users,
      color: 'text-purple-500'
    },
    {
      numero: 3,
      titre: "Votre situation actuelle",
      soustitre: "Êtes-vous actuellement enceinte ?",
      icon: Baby,
      color: 'text-blue-500'
    },
    {
      numero: 4,
      titre: "Vos centres d'intérêt",
      soustitre: "Personnalisez votre expérience",
      icon: Sparkles,
      color: 'text-amber-500'
    },
    {
      numero: 5,
      titre: "Notifications",
      soustitre: "Restez informée au bon moment",
      icon: Bell,
      color: 'text-green-500'
    }
  ];

  const interetsPossibles = [
    { id: 'grossesse', label: 'Suivi de grossesse', emoji: '🤰' },
    { id: 'nutrition', label: 'Nutrition', emoji: '🥗' },
    { id: 'developpement', label: 'Développement enfant', emoji: '👶' },
    { id: 'allaitement', label: 'Allaitement', emoji: '🍼' },
    { id: 'contraception', label: 'Contraception', emoji: '💊' },
    { id: 'sante_mentale', label: 'Santé mentale', emoji: '🧘‍♀️' },
    { id: 'communaute', label: 'Communauté', emoji: '👥' }
  ];

  const progressPourcentage = (etape / etapes.length) * 100;

  const handleNext = () => {
    if (etape < etapes.length) {
      setEtape(etape + 1);
    } else {
      creerProfil.mutate(data);
    }
  };

  const canProceed = () => {
    switch (etape) {
      case 1: return true;
      case 2: return data.nom_complet && data.date_naissance && data.ville;
      case 3: return data.est_enceinte !== null;
      case 4: return data.interets.length > 0;
      case 5: return true;
      default: return false;
    }
  };

  const EtapeIcon = etapes[etape - 1].icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 z-50 overflow-auto">
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Étape {etape} sur {etapes.length}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(progressPourcentage)}%
              </span>
            </div>
            <Progress value={progressPourcentage} className="h-2" />
          </div>

          {/* Contenu de l'étape */}
          <Card className="shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={etape}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 mb-4`}>
                      <EtapeIcon className={`w-8 h-8 ${etapes[etape - 1].color}`} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {etapes[etape - 1].titre}
                    </h2>
                    <p className="text-gray-600">{etapes[etape - 1].soustitre}</p>
                  </div>

                  {/* Étape 1: Bienvenue */}
                  {etape === 1 && (
                    <div className="text-center space-y-6">
                      <div className="flex justify-center gap-4">
                        <Badge className="bg-pink-100 text-pink-800 px-4 py-2">
                          🤰 Suivi grossesse
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                          👶 Carnet santé bébé
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
                          💊 Contraception
                        </Badge>
                      </div>
                      <p className="text-gray-700 text-lg">
                        Votre compagnon santé pour la maternité et l'enfance, 
                        avec suivi personnalisé et conseils d'experts.
                      </p>
                    </div>
                  )}

                  {/* Étape 2: Infos personnelles */}
                  {etape === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nom complet *</label>
                        <Input
                          value={data.nom_complet}
                          onChange={(e) => setData({...data, nom_complet: e.target.value})}
                          placeholder="Votre nom complet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Date de naissance *</label>
                        <Calendar
                          mode="single"
                          selected={data.date_naissance}
                          onSelect={(date) => setData({...data, date_naissance: date})}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Ville *</label>
                        <Input
                          value={data.ville}
                          onChange={(e) => setData({...data, ville: e.target.value})}
                          placeholder="Votre ville"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Téléphone</label>
                        <Input
                          value={data.telephone}
                          onChange={(e) => setData({...data, telephone: e.target.value})}
                          placeholder="+225 XX XX XX XX"
                        />
                      </div>
                    </div>
                  )}

                  {/* Étape 3: Situation */}
                  {etape === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setData({...data, est_enceinte: true})}
                          className={`p-6 border-2 rounded-xl transition-all ${
                            data.est_enceinte === true
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-4xl mb-2">🤰</div>
                          <p className="font-semibold">Oui, je suis enceinte</p>
                        </button>
                        <button
                          onClick={() => setData({...data, est_enceinte: false})}
                          className={`p-6 border-2 rounded-xl transition-all ${
                            data.est_enceinte === false
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-4xl mb-2">👶</div>
                          <p className="font-semibold">Non, j'ai des enfants</p>
                        </button>
                      </div>

                      {data.est_enceinte && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Date de vos dernières règles
                            </label>
                            <Calendar
                              mode="single"
                              selected={data.date_derniere_regle}
                              onSelect={(date) => setData({...data, date_derniere_regle: date})}
                              className="rounded-md border"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Étape 4: Intérêts */}
                  {etape === 4 && (
                    <div className="space-y-4">
                      <p className="text-gray-600 text-center mb-6">
                        Sélectionnez les sujets qui vous intéressent (au moins 1)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {interetsPossibles.map(interet => (
                          <button
                            key={interet.id}
                            onClick={() => {
                              const newInterets = data.interets.includes(interet.id)
                                ? data.interets.filter(i => i !== interet.id)
                                : [...data.interets, interet.id];
                              setData({...data, interets: newInterets});
                            }}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              data.interets.includes(interet.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-3xl mb-2">{interet.emoji}</div>
                            <p className="text-sm font-medium">{interet.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Étape 5: Notifications */}
                  {etape === 5 && (
                    <div className="space-y-6 text-center">
                      <div className="text-6xl mb-4">🔔</div>
                      <p className="text-gray-700">
                        Recevez des rappels personnalisés pour :
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                          <p className="text-sm font-medium">Rendez-vous médicaux</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-blue-600 mb-2" />
                          <p className="text-sm font-medium">Vaccinations</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-purple-600 mb-2" />
                          <p className="text-sm font-medium">Médicaments</p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-pink-600 mb-2" />
                          <p className="text-sm font-medium">Jalons bébé</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Boutons */}
                  <div className="flex gap-3 mt-8">
                    {etape > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setEtape(etape - 1)}
                        className="flex-1"
                      >
                        Retour
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed() || creerProfil.isPending}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      {etape === etapes.length ? (
                        creerProfil.isPending ? 'Création...' : 'Commencer'
                      ) : (
                        <>
                          Suivant <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}