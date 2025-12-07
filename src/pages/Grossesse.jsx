import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Baby,
  Calendar,
  Plus,
  Heart,
  Activity,
  FileText,
  Stethoscope,
  Syringe,
  TrendingUp,
  Clock,
  Scale,
  Calculator,
  Sparkles,
  Bell,
  Apple,
  ClipboardList,
  HelpCircle,
  Camera,
  ChevronRight,
  Settings
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BottomSheet } from "@/components/ui/safe-area-view";

import ConfigurerGrossesse from "../components/grossesse/ConfigurerGrossesse";
import EvolutionBebe from "../components/grossesse/EvolutionBebe";
import ConsultationsPrenatales from "../components/grossesse/ConsultationsPrenatales";
import JournalGrossesse from "../components/grossesse/JournalGrossesse";
import VaccinsGrossesse from "../components/grossesse/VaccinsGrossesse";
import SuiviTensionArterielle from "../components/grossesse/SuiviTensionArterielle";
import CalculateurAgeGestationnel from "../components/grossesse/CalculateurAgeGestationnel";
import ConseilsTrimestreIA from "../components/grossesse/ConseilsTrimestreIA";
import SuiviPoidsGrossesse from "../components/grossesse/SuiviPoidsGrossesse";
import RappelsPrenatals from "../components/grossesse/RappelsPrenatals";
import JournalSymptomes from "../components/grossesse/JournalSymptomes";
import ConseilsNutritionActivite from "../components/grossesse/ConseilsNutritionActivite";
import QuestionsMedecin from "../components/grossesse/QuestionsMedecin";
import CalendrierEtapesGrossesse from "../components/grossesse/CalendrierEtapesGrossesse";
import JournalPhotosSemaine from "../components/grossesse/JournalPhotosSemaine";

// Configuration des sections de la page
const SECTIONS = [
  { id: 'evolution', label: 'Évolution Bébé', icon: Baby, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50' },
  { id: 'symptomes', label: 'Symptômes', icon: ClipboardList, color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50' },
  { id: 'conseils', label: 'Conseils IA', icon: Sparkles, color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-50' },
  { id: 'nutrition', label: 'Nutrition', icon: Apple, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50' },
  { id: 'poids', label: 'Poids', icon: Scale, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50' },
  { id: 'photos', label: 'Journal Photo', icon: Camera, color: 'from-pink-500 to-fuchsia-500', bgColor: 'bg-pink-50' },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50' },
  { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'from-teal-500 to-cyan-500', bgColor: 'bg-teal-50' },
  { id: 'rappels', label: 'Rappels', icon: Bell, color: 'from-red-500 to-rose-500', bgColor: 'bg-red-50' },
  { id: 'tension', label: 'Tension', icon: Heart, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50' },
  { id: 'consultations', label: 'Consultations', icon: Stethoscope, color: 'from-teal-500 to-emerald-500', bgColor: 'bg-teal-50' },
  { id: 'vaccins', label: 'Vaccins', icon: Syringe, color: 'from-green-500 to-lime-500', bgColor: 'bg-green-50' },
  { id: 'journal', label: 'Notes', icon: FileText, color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50' },
  { id: 'calculateur', label: 'Calculateur', icon: Calculator, color: 'from-violet-500 to-purple-500', bgColor: 'bg-violet-50' },
];

export default function Grossesse() {
  const [showConfigurer, setShowConfigurer] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const queryClient = useQueryClient();

  const { data: grossesse, isLoading } = useQuery({
    queryKey: ['grossesse_active'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({ 
        grossesse_active: true 
      });
      return grossesses[0] || null;
    },
    initialData: null,
  });

  const calculateGrossesseInfo = () => {
    if (!grossesse) return null;

    const today = new Date();
    const ddr = new Date(grossesse.date_derniere_regle);
    const dpa = new Date(grossesse.date_accouchement_prevue);

    const joursDepuisDDR = differenceInDays(today, ddr);
    const semainesGrossesse = Math.floor(joursDepuisDDR / 7);
    const joursRestants = joursDepuisDDR % 7;
    const trimestre = semainesGrossesse < 14 ? 1 : semainesGrossesse < 28 ? 2 : 3;
    const joursAvantAccouchement = differenceInDays(dpa, today);
    const semainesAvantAccouchement = Math.floor(joursAvantAccouchement / 7);
    const pourcentageProgression = Math.min(100, Math.round((semainesGrossesse / 40) * 100));

    return {
      semainesGrossesse,
      joursRestants,
      trimestre,
      joursAvantAccouchement,
      semainesAvantAccouchement,
      pourcentageProgression,
      dpa
    };
  };

  const info = calculateGrossesseInfo();

  const getTrimestreColor = (trimestre) => {
    switch (trimestre) {
      case 1: return "from-pink-400 to-rose-500";
      case 2: return "from-purple-400 to-violet-500";
      case 3: return "from-blue-400 to-cyan-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getTrimestreBg = (trimestre) => {
    switch (trimestre) {
      case 1: return "bg-gradient-to-br from-pink-50 to-rose-100";
      case 2: return "bg-gradient-to-br from-purple-50 to-violet-100";
      case 3: return "bg-gradient-to-br from-blue-50 to-cyan-100";
      default: return "bg-gray-50";
    }
  };

  const prochaines_consultations = [
    { semaine: 8, titre: "1ère consultation prénatale" },
    { semaine: 12, titre: "Échographie de datation" },
    { semaine: 16, titre: "2ème consultation" },
    { semaine: 20, titre: "Échographie morphologique" },
    { semaine: 24, titre: "3ème consultation" },
    { semaine: 28, titre: "4ème consultation + vaccin coqueluche" },
    { semaine: 32, titre: "Échographie de croissance" },
    { semaine: 36, titre: "Consultation pré-accouchement" },
    { semaine: 39, titre: "Consultation terme" }
  ];

  const getProchaineConsultation = () => {
    if (!info) return null;
    return prochaines_consultations.find(c => c.semaine > info.semainesGrossesse);
  };

  const prochaineConsult = getProchaineConsultation();

  const renderSectionContent = () => {
    if (!activeSection || !info) return null;

    const props = { grossesse, semainesGrossesse: info.semainesGrossesse, trimestre: info.trimestre };

    switch (activeSection) {
      case 'evolution': return <EvolutionBebe {...props} />;
      case 'symptomes': return <JournalSymptomes {...props} />;
      case 'conseils': return <ConseilsTrimestreIA {...props} />;
      case 'nutrition': return <ConseilsNutritionActivite {...props} />;
      case 'poids': return <SuiviPoidsGrossesse grossesse={grossesse} />;
      case 'photos': return <JournalPhotosSemaine {...props} />;
      case 'calendrier': return <CalendrierEtapesGrossesse {...props} />;
      case 'questions': return <QuestionsMedecin {...props} />;
      case 'rappels': return <RappelsPrenatals {...props} />;
      case 'tension': return <SuiviTensionArterielle grossesse={grossesse} />;
      case 'consultations': return <ConsultationsPrenatales {...props} />;
      case 'vaccins': return <VaccinsGrossesse {...props} />;
      case 'journal': return <JournalGrossesse {...props} />;
      case 'calculateur': return <CalculateurAgeGestationnel grossesse={grossesse} />;
      default: return null;
    }
  };

  // Page d'onboarding si pas de grossesse
  if (!grossesse && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <Baby className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Suivi de Grossesse</h1>
          <p className="text-gray-600 mb-8 max-w-sm">
            Félicitations ! Commencez le suivi de votre grossesse semaine par semaine.
          </p>
          <Button 
            onClick={() => setShowConfigurer(true)}
            size="lg"
            className="w-full max-w-xs h-14 bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg text-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Démarrer mon suivi
          </Button>

          <div className="grid grid-cols-3 gap-4 mt-10 w-full max-w-sm">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
              <Calendar className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Calcul DPA</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
              <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Évolution</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
              <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Conseils IA</p>
            </div>
          </div>
        </div>

        {showConfigurer && (
          <ConfigurerGrossesse onClose={() => setShowConfigurer(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      {info && (
        <>
          {/* Header compact mobile-first */}
          <div className={`${getTrimestreBg(info.trimestre)} pt-2 pb-4 px-4`}>
            {/* Semaine en cours - Hero compact */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 bg-gradient-to-br ${getTrimestreColor(info.trimestre)} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-lg">{info.semainesGrossesse}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Semaine</p>
                  <p className="text-lg font-bold text-gray-900">
                    {info.semainesGrossesse} SA + {info.joursRestants}j
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConfigurer(true)}
                className="rounded-full"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

            {/* Barre de progression compacte */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge className={`bg-gradient-to-r ${getTrimestreColor(info.trimestre)} text-white border-0`}>
                  T{info.trimestre}
                </Badge>
                <span className="text-sm font-semibold text-gray-700">{info.pourcentageProgression}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                <div 
                  className={`h-2.5 rounded-full bg-gradient-to-r ${getTrimestreColor(info.trimestre)} transition-all duration-500`}
                  style={{ width: `${info.pourcentageProgression}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>DPA: {format(info.dpa, "dd MMM", { locale: fr })}</span>
                <span>{info.semainesAvantAccouchement} sem. restantes</span>
              </div>
            </div>
          </div>

          {/* Prochaine consultation - carte compacte */}
          {prochaineConsult && (
            <div className="px-4 -mt-2 mb-4">
              <Link to={createPageUrl('Teleconsultation')}>
                <Card className="border-0 shadow-md bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{prochaineConsult.titre}</p>
                      <p className="text-xs text-white/80">SA {prochaineConsult.semaine} • Dans {prochaineConsult.semaine - info.semainesGrossesse} sem.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {/* Stats rapides - grille compacte */}
          <div className="px-4 mb-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: FileText, value: grossesse.consultations?.length || 0, label: 'Consult.', color: 'text-blue-500' },
                { icon: Activity, value: grossesse.echographies?.length || 0, label: 'Échos', color: 'text-purple-500' },
                { icon: Syringe, value: grossesse.vaccins?.length || 0, label: 'Vaccins', color: 'text-green-500' },
                { icon: TrendingUp, value: grossesse.examens?.length || 0, label: 'Examens', color: 'text-orange-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grille des sections - navigation mobile */}
          <div className="px-4 pb-32">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Mes outils</h2>
            <div className="grid grid-cols-4 gap-3">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm active:scale-95 transition-transform"
                  >
                    <div className={`w-11 h-11 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center mb-2 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] text-gray-700 font-medium text-center leading-tight">
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Sheet pour le contenu de chaque section */}
          <BottomSheet
            isOpen={!!activeSection}
            onClose={() => setActiveSection(null)}
            title={SECTIONS.find(s => s.id === activeSection)?.label || ''}
            fullHeight
          >
            <div className="p-4 overflow-y-auto h-full pb-safe">
              {renderSectionContent()}
            </div>
          </BottomSheet>

          {showConfigurer && (
            <ConfigurerGrossesse 
              grossesseExistante={grossesse}
              onClose={() => setShowConfigurer(false)} 
            />
          )}
        </>
      )}

      <style>{`
        .pb-safe {
          padding-bottom: max(2rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}