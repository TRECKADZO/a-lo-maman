import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  Heart,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HeartPulse,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnboardingMaman({ onComplete }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    nom_complet: '',
    date_naissance: '',
    ville: '',
    region: '',
    telephone: '',
    situation: '',
    grossesse_active: null,
    date_derniere_regle: '',
    enfants_existants: 0
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const createProfile = useMutation({
    mutationFn: async (data) => {
      // Créer le profil maman
      const profil = await base44.entities.ProfilMaman.create({
        nom_complet: data.nom_complet,
        date_naissance: data.date_naissance,
        ville: data.ville,
        region: data.region,
        telephone: data.telephone,
        situation_familiale: data.situation,
        langue_preferee: 'francais',
        onboarding_completed: true
      });

      // Si grossesse active, créer le suivi
      if (data.grossesse_active && data.date_derniere_regle) {
        const ddr = new Date(data.date_derniere_regle);
        const dpa = new Date(ddr);
        dpa.setDate(dpa.getDate() + 280);

        await base44.entities.SuiviGrossesse.create({
          date_derniere_regle: data.date_derniere_regle,
          date_accouchement_prevue: dpa.toISOString().split('T')[0],
          grossesse_active: true,
          type_grossesse: 'unique'
        });
      }

      return profil;
    },
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      setTimeout(() => onComplete?.(), 1500);
    }
  });

  const steps = [
    {
      title: "Bienvenue sur A'lo Maman ! 🌸",
      subtitle: "Votre compagnon santé maternelle et infantile",
      icon: Heart,
      color: "from-pink-400 to-rose-500",
      component: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenue {user?.full_name?.split(' ')[0]} ! 👋
            </h2>
            <p className="text-gray-600">
              Nous allons vous accompagner dans votre parcours de maternité avec des outils personnalisés
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: HeartPulse, label: 'Suivi Grossesse' },
              { icon: Baby, label: 'Carnet Enfant' },
              { icon: Users, label: 'Communauté' }
            ].map((feature, idx) => (
              <div key={idx} className="p-4 bg-pink-50 rounded-lg">
                <feature.icon className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                <p className="text-xs font-medium">{feature.label}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Parlez-nous de vous",
      subtitle: "Informations personnelles",
      icon: Users,
      color: "from-purple-400 to-pink-500",
      component: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nom complet</label>
            <Input
              value={formData.nom_complet}
              onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })}
              placeholder="Ex: Koné Aminata"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date de naissance</label>
            <Input
              type="date"
              value={formData.date_naissance}
              onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ville</label>
              <Input
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Région</label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Téléphone</label>
            <Input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+225 XX XX XX XX XX"
            />
          </div>
        </div>
      )
    },
    {
      title: "Votre situation",
      subtitle: "Aidez-nous à personnaliser votre expérience",
      icon: Heart,
      color: "from-blue-400 to-cyan-500",
      component: (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Êtes-vous actuellement enceinte ?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, grossesse_active: true })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.grossesse_active === true
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <HeartPulse className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                <p className="font-semibold">Oui</p>
              </button>
              <button
                onClick={() => setFormData({ ...formData, grossesse_active: false })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.grossesse_active === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Baby className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold">Non</p>
              </button>
            </div>
          </div>

          {formData.grossesse_active && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="text-sm font-medium mb-2 block">Date de vos dernières règles</label>
              <Input
                type="date"
                value={formData.date_derniere_regle}
                onChange={(e) => setFormData({ ...formData, date_derniere_regle: e.target.value })}
              />
            </motion.div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Avez-vous déjà des enfants ?</label>
            <Input
              type="number"
              min="0"
              value={formData.enfants_existants}
              onChange={(e) => setFormData({ ...formData, enfants_existants: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )
    },
    {
      title: "Tout est prêt ! 🎉",
      subtitle: "Commencez votre parcours",
      icon: CheckCircle,
      color: "from-green-400 to-emerald-500",
      component: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Votre profil est prêt !
            </h2>
            <p className="text-gray-600">
              Vous avez maintenant accès à tous les outils pour suivre votre santé et celle de votre famille
            </p>
          </div>
          <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">✨ Fonctionnalités activées :</p>
            <div className="space-y-2">
              {formData.grossesse_active && (
                <Badge className="bg-pink-500">Suivi Grossesse</Badge>
              )}
              <Badge className="bg-blue-500">Carnet de Santé</Badge>
              <Badge className="bg-purple-500">Assistant IA</Badge>
              <Badge className="bg-teal-500">Téléconsultations</Badge>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const progress = ((step + 1) / steps.length) * 100;

  const canGoNext = () => {
    if (step === 1) {
      return formData.nom_complet && formData.date_naissance && formData.ville;
    }
    if (step === 2) {
      return formData.grossesse_active !== null;
    }
    return true;
  };

  const handleNext = () => {
    if (step === steps.length - 1) {
      createProfile.mutate(formData);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Étape {step + 1} sur {steps.length}
              </span>
              <span className="text-sm font-medium text-pink-600">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${currentStep.color} rounded-full flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStep.title}
            </h1>
            <p className="text-gray-600">{currentStep.subtitle}</p>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep.component}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || createProfile.isPending}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
            >
              {step === steps.length - 1 ? (
                createProfile.isPending ? (
                  'Configuration...'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Commencer
                  </>
                )
              ) : (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}