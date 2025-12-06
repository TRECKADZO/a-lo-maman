import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Baby,
  Syringe,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, addWeeks, startOfWeek, differenceInWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

// Étapes clés de la grossesse
const ETAPES_CLES = [
  { semaine: 8, titre: "1ère consultation prénatale", type: "consultation", description: "Déclaration de grossesse, examens sanguins", icon: Stethoscope },
  { semaine: 12, titre: "Échographie de datation (T1)", type: "echographie", description: "Mesure de la clarté nucale, datation", icon: Activity },
  { semaine: 16, titre: "2ème consultation prénatale", type: "consultation", description: "Suivi de grossesse, prise de poids", icon: Stethoscope },
  { semaine: 20, titre: "Échographie morphologique (T2)", type: "echographie", description: "Examen détaillé de l'anatomie du bébé", icon: Activity },
  { semaine: 24, titre: "3ème consultation prénatale", type: "consultation", description: "Test de dépistage du diabète gestationnel", icon: Stethoscope },
  { semaine: 28, titre: "4ème consultation + Vaccin coqueluche", type: "vaccin", description: "Vaccination dTcaP recommandée, prévention anémie", icon: Syringe },
  { semaine: 32, titre: "Échographie de croissance (T3)", type: "echographie", description: "Vérification de la croissance et position du bébé", icon: Activity },
  { semaine: 34, titre: "5ème consultation prénatale", type: "consultation", description: "Préparation à l'accouchement, projet de naissance", icon: Stethoscope },
  { semaine: 36, titre: "Consultation pré-accouchement", type: "consultation", description: "Choix maternité, signes d'alerte", icon: Stethoscope },
  { semaine: 37, titre: "6ème consultation prénatale", type: "consultation", description: "Bébé à terme, monitoring possible", icon: Stethoscope },
  { semaine: 39, titre: "7ème consultation prénatale", type: "consultation", description: "Vérification engagement du bébé", icon: Stethoscope },
  { semaine: 40, titre: "Date terme prévue", type: "terme", description: "Accouchement prévu cette semaine", icon: Baby },
  { semaine: 41, titre: "Dépassement terme", type: "consultation", description: "Surveillance rapprochée, déclenchement possible", icon: AlertCircle },
];

const getTypeColor = (type) => {
  switch (type) {
    case 'consultation': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' };
    case 'echographie': return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' };
    case 'vaccin': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' };
    case 'terme': return { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-500' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
  }
};

export default function CalendrierEtapesGrossesse({ grossesse, semainesGrossesse }) {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' ou 'calendar'
  const [selectedEtape, setSelectedEtape] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const ddr = new Date(grossesse.date_derniere_regle);
  const dpa = new Date(grossesse.date_accouchement_prevue);

  // Calcul de la date pour chaque étape
  const getDateForSemaine = (semaine) => {
    return addWeeks(ddr, semaine);
  };

  // Vérifier si une étape est passée, en cours ou à venir
  const getEtapeStatus = (semaine) => {
    if (semaine < semainesGrossesse) return 'passee';
    if (semaine === semainesGrossesse) return 'actuelle';
    return 'avenir';
  };

  // Prochaine étape
  const prochaineEtape = ETAPES_CLES.find(e => e.semaine > semainesGrossesse);

  // RDV déjà enregistrés
  const rdvEnregistres = grossesse.consultations || [];
  const echosEnregistrees = grossesse.echographies || [];

  return (
    <div className="space-y-4">
      {/* Prochaine étape - Compact */}
      {prochaineEtape && (
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <prochaineEtape.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge className="bg-pink-500 text-white text-[10px]">Prochaine</Badge>
                <span className="text-xs text-gray-500">dans {prochaineEtape.semaine - semainesGrossesse} sem.</span>
              </div>
              <p className="font-bold text-gray-900 text-sm truncate">{prochaineEtape.titre}</p>
              <p className="text-xs text-gray-500">SA {prochaineEtape.semaine} • {format(getDateForSemaine(prochaineEtape.semaine), 'dd MMM', { locale: fr })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle vue - Pills compacts */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'timeline' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          Timeline
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'calendar' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendrier
        </button>
      </div>

      {/* Vue Timeline - Compact mobile */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-3">
              {ETAPES_CLES.map((etape, index) => {
                const status = getEtapeStatus(etape.semaine);
                const colors = getTypeColor(etape.type);
                const Icon = etape.icon;
                const dateEtape = getDateForSemaine(etape.semaine);

                return (
                  <button 
                    key={index} 
                    className={`relative pl-10 w-full text-left active:scale-[0.99] transition-transform ${status === 'passee' ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedEtape(selectedEtape === index ? null : index)}
                  >
                    {/* Point timeline */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      status === 'passee' ? 'bg-green-500 border-green-500' :
                      status === 'actuelle' ? 'bg-pink-500 border-pink-500 animate-pulse' :
                      'bg-white border-gray-300'
                    }`}>
                      {status === 'passee' && <CheckCircle className="w-3 h-3 text-white" />}
                      {status === 'actuelle' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>

                    {/* Contenu compact */}
                    <div className={`p-3 rounded-xl ${status === 'actuelle' ? 'bg-pink-50 border border-pink-300' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          status === 'actuelle' ? 'bg-pink-500' : colors.bg
                        }`}>
                          <Icon className={`w-4 h-4 ${status === 'actuelle' ? 'text-white' : colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm text-gray-900 truncate">{etape.titre}</p>
                            {status === 'actuelle' && <span className="text-[10px] px-1.5 py-0.5 bg-pink-500 text-white rounded">Maintenant</span>}
                          </div>
                          <p className="text-xs text-gray-500">SA {etape.semaine} • {format(dateEtape, 'dd MMM', { locale: fr })}</p>
                        </div>
                        {selectedEtape === index ? <ChevronLeft className="w-4 h-4 text-gray-400 rotate-90" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>

                      {selectedEtape === index && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600">{etape.description}</p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Vue Calendrier */}
      {viewMode === 'calendar' && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                Calendrier de grossesse
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addWeeks(currentMonth, -4))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addWeeks(currentMonth, 4))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Légende */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Consultation</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Échographie</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Vaccin</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                <span>Terme</span>
              </div>
            </div>

            {/* Grille calendrier simplifié par semaines */}
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, weekIndex) => {
                const weekStart = addWeeks(startOfWeek(currentMonth, { weekStartsOn: 1 }), weekIndex);
                const semaineGrossesseActuelle = differenceInWeeks(weekStart, ddr);
                const etapesSemaine = ETAPES_CLES.filter(e => e.semaine === semaineGrossesseActuelle);
                const isCurrentWeek = semaineGrossesseActuelle === semainesGrossesse;

                if (semaineGrossesseActuelle < 0 || semaineGrossesseActuelle > 42) return null;

                return (
                  <div 
                    key={weekIndex}
                    className={`p-3 rounded-lg border ${
                      isCurrentWeek ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCurrentWeek ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {semaineGrossesseActuelle}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Semaine {semaineGrossesseActuelle}
                            {isCurrentWeek && <span className="text-pink-500 ml-2">(Vous êtes ici)</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(weekStart, 'dd MMM', { locale: fr })} - {format(addWeeks(weekStart, 1), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      
                      {etapesSemaine.length > 0 && (
                        <div className="flex gap-2">
                          {etapesSemaine.map((etape, i) => {
                            const colors = getTypeColor(etape.type);
                            const Icon = etape.icon;
                            return (
                              <div 
                                key={i}
                                className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text} flex items-center gap-1 text-xs font-medium`}
                              >
                                <Icon className="w-3 h-3" />
                                {etape.titre.split(' ')[0]}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats progression - Compact */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600">{ETAPES_CLES.filter(e => e.semaine < semainesGrossesse).length}</p>
          <p className="text-[10px] text-gray-500">Passées</p>
        </div>
        <div className="bg-pink-50 rounded-xl p-3 text-center">
          <Clock className="w-5 h-5 text-pink-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-pink-600">{ETAPES_CLES.filter(e => e.semaine === semainesGrossesse).length}</p>
          <p className="text-[10px] text-gray-500">Maintenant</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600">{ETAPES_CLES.filter(e => e.semaine > semainesGrossesse).length}</p>
          <p className="text-[10px] text-gray-500">À venir</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <Baby className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-600">{40 - semainesGrossesse}</p>
          <p className="text-[10px] text-gray-500">Sem. rest.</p>
        </div>
      </div>
    </div>
  );
}