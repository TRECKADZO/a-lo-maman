import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, FileText, Calendar, User, Stethoscope, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHECKLIST_ITEMS = [
  {
    id: 'basic_info',
    title: 'Informations de base',
    description: 'Nom, spécialité, région, ville',
    icon: User,
    page: 'Parametres'
  },
  {
    id: 'documents',
    title: 'Documents professionnels',
    description: 'Diplômes, licences, certifications',
    icon: FileText,
    page: 'Parametres'
  },
  {
    id: 'availability',
    title: 'Disponibilités',
    description: 'Créneaux horaires et types de consultation',
    icon: Calendar,
    page: 'MonAgenda'
  },
  {
    id: 'profile_details',
    title: 'Profil détaillé',
    description: 'Biographie, langues, formations',
    icon: Stethoscope,
    page: 'Parametres'
  }
];

export default function OnboardingChecklist({ profilPro, userProfile, onNavigate, onDismiss, visible = true }) {
  if (!visible) return null;

  const getCompletionStatus = () => {
    const status = {
      basic_info: !!(profilPro?.region && profilPro?.ville && profilPro?.specialite),
      documents: !!(profilPro?.formation?.length > 0 || profilPro?.certifications?.length > 0),
      availability: !!(profilPro?.disponibilites?.length > 0),
      profile_details: !!(profilPro?.biographie || profilPro?.langues?.length > 1)
    };
    return status;
  };

  const status = getCompletionStatus();
  const completedCount = Object.values(status).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  if (isComplete) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Profil complété !</h3>
                    <p className="text-sm text-green-700">
                      Votre profil professionnel est maintenant complet et visible par les patients.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  Complétez votre profil professionnel
                </CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {completedCount} sur {totalCount} étapes complétées
                    </span>
                    <Badge className="bg-teal-600">{Math.round(progressPercentage)}%</Badge>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onDismiss} className="ml-2">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => {
              const Icon = item.icon;
              const isCompleted = status[item.id];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-white border border-gray-200 hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                        {item.title}
                      </h4>
                      <p className={`text-sm ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate(item.page)}
                      className="border-teal-300 text-teal-700 hover:bg-teal-50"
                    >
                      Compléter
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </motion.div>
              );
            })}

            <div className="pt-2 text-xs text-gray-600 text-center">
              Un profil complet augmente votre visibilité et inspire confiance aux patients
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}