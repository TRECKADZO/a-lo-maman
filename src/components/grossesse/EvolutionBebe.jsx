import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Baby, Activity, TrendingUp, Heart, ChevronDown, ChevronUp, Sparkles, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AjouterDeveloppementBebe from "./AjouterDeveloppementBebe";

export default function EvolutionBebe({ semainesGrossesse, trimestre, grossesse }) {
  const [showConseils, setShowConseils] = useState(false);
  const [showEchos, setShowEchos] = useState(false);
  const [showAjouterDev, setShowAjouterDev] = useState(false);
  const [showMesures, setShowMesures] = useState(false);
  const evolutionData = {
    1: {
      titre: "Semaines 1-4",
      description: "Fécondation et implantation",
      taille: "0.1 mm",
      poids: "< 1 g",
      developpement: [
        "Fécondation de l'ovule",
        "Implantation dans l'utérus",
        "Formation du placenta",
        "Début de production d'hormones"
      ]
    },
    5: {
      titre: "Semaines 5-8",
      description: "Formation des organes vitaux",
      taille: "1-2 cm",
      poids: "1-2 g",
      developpement: [
        "Formation du cœur qui commence à battre",
        "Développement du cerveau",
        "Formation des membres",
        "Apparition des yeux et oreilles"
      ]
    },
    9: {
      titre: "Semaines 9-13",
      description: "Fin du 1er trimestre",
      taille: "7-8 cm",
      poids: "20-30 g",
      developpement: [
        "Tous les organes principaux sont formés",
        "Début des mouvements",
        "Formation des empreintes digitales",
        "Le sexe devient identifiable"
      ]
    },
    14: {
      titre: "Semaines 14-18",
      description: "Croissance rapide",
      taille: "15-18 cm",
      poids: "150-200 g",
      developpement: [
        "Croissance rapide du corps",
        "Développement des cheveux et ongles",
        "Bébé peut sucer son pouce",
        "Mouvements plus actifs"
      ]
    },
    19: {
      titre: "Semaines 19-22",
      description: "Perception sensorielle",
      taille: "25 cm",
      poids: "400-500 g",
      developpement: [
        "Développement de l'ouïe",
        "Formation du vernix (protection)",
        "Vous commencez à sentir les mouvements",
        "Développement des sens"
      ]
    },
    23: {
      titre: "Semaines 23-27",
      description: "Fin du 2e trimestre",
      taille: "33-35 cm",
      poids: "800-1000 g",
      developpement: [
        "Ouverture des yeux",
        "Réponse aux sons",
        "Cycles de sommeil réguliers",
        "Viabilité en cas de naissance prématurée"
      ]
    },
    28: {
      titre: "Semaines 28-32",
      description: "Maturation des poumons",
      taille: "40-42 cm",
      poids: "1500-1800 g",
      developpement: [
        "Maturation des poumons",
        "Prise de poids importante",
        "Position tête en bas",
        "Mouvements très perceptibles"
      ]
    },
    33: {
      titre: "Semaines 33-36",
      description: "Préparation à la naissance",
      taille: "45-47 cm",
      poids: "2200-2700 g",
      developpement: [
        "Développement du système immunitaire",
        "Accumulation de graisse",
        "Descente dans le bassin",
        "Prêt à naître"
      ]
    },
    37: {
      titre: "Semaines 37-40",
      description: "À terme",
      taille: "48-52 cm",
      poids: "3000-3500 g",
      developpement: [
        "Bébé est à terme (37 semaines)",
        "Tous les organes sont matures",
        "Prêt pour la vie extra-utérine",
        "En attente du déclenchement du travail"
      ]
    }
  };

  const getCurrentPhase = () => {
    if (semainesGrossesse < 5) return evolutionData[1];
    if (semainesGrossesse < 9) return evolutionData[5];
    if (semainesGrossesse < 14) return evolutionData[9];
    if (semainesGrossesse < 19) return evolutionData[14];
    if (semainesGrossesse < 23) return evolutionData[19];
    if (semainesGrossesse < 28) return evolutionData[23];
    if (semainesGrossesse < 33) return evolutionData[28];
    if (semainesGrossesse < 37) return evolutionData[33];
    return evolutionData[37];
  };

  const phase = getCurrentPhase();

  const conseilsParTrimestre = {
    1: [
      "Prenez de l'acide folique (400 µg/jour)",
      "Évitez l'alcool et le tabac",
      "Reposez-vous suffisamment",
      "Hydratez-vous bien",
      "Consultez votre médecin pour la 1ère visite prénatale"
    ],
    2: [
      "Continuez une alimentation équilibrée",
      "Pratiquez une activité physique douce",
      "Portez des vêtements confortables",
      "Préparez votre liste de naissance",
      "Inscrivez-vous aux cours de préparation"
    ],
    3: [
      "Préparez votre valise de maternité",
      "Reposez-vous et évitez le stress",
      "Surveillez les signes du travail",
      "Finalisez l'aménagement de la chambre",
      "Discutez de votre projet de naissance"
    ]
  };

  return (
    <div className="space-y-4">
      {/* Hero compact - Stats bébé */}
      <div className="bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Baby className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs text-pink-700 font-medium">{phase.titre}</p>
            <p className="text-lg font-bold text-gray-900">{phase.description}</p>
          </div>
        </div>

        {/* Stats en grille compacte */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{phase.taille}</p>
            <p className="text-[10px] text-gray-500">Taille</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <Activity className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{phase.poids}</p>
            <p className="text-[10px] text-gray-500">Poids</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{semainesGrossesse}</p>
            <p className="text-[10px] text-gray-500">SA</p>
          </div>
        </div>
      </div>

      {/* Développement - Liste compacte */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          Développement cette semaine
        </h3>
        <div className="space-y-2">
          {phase.developpement.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-2 bg-pink-50 rounded-xl">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
              <span className="text-sm text-gray-700 flex-1">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conseils du trimestre - Accordéon */}
      <button
        onClick={() => setShowConseils(!showConseils)}
        className="w-full bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-4 shadow-sm text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💡</span>
            </div>
            <div>
              <p className="font-semibold text-purple-900">Conseils T{trimestre}</p>
              <p className="text-xs text-purple-600">{conseilsParTrimestre[trimestre].length} conseils</p>
            </div>
          </div>
          {showConseils ? <ChevronUp className="w-5 h-5 text-purple-500" /> : <ChevronDown className="w-5 h-5 text-purple-500" />}
        </div>

        {showConseils && (
          <div className="mt-4 space-y-2 border-t border-purple-200 pt-3">
            {conseilsParTrimestre[trimestre].map((conseil, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-purple-800">
                <span className="text-purple-500">•</span>
                <span>{conseil}</span>
              </div>
            ))}
          </div>
        )}
      </button>

      {/* Mes mesures enregistrées */}
      {grossesse?.developpement_bebe && grossesse.developpement_bebe.length > 0 && (
        <button
          onClick={() => setShowMesures(!showMesures)}
          className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 shadow-sm text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Mesures enregistrées</p>
                <p className="text-xs text-green-600">{grossesse.developpement_bebe.length} mesure(s)</p>
              </div>
            </div>
            {showMesures ? <ChevronUp className="w-5 h-5 text-green-500" /> : <ChevronDown className="w-5 h-5 text-green-500" />}
          </div>

          {showMesures && (
            <div className="mt-4 space-y-2 border-t border-green-200 pt-3">
              {grossesse.developpement_bebe
                .sort((a, b) => b.semaine_amenorrhee - a.semaine_amenorrhee)
                .map((mesure, index) => (
                  <div key={index} className="p-3 bg-white rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm text-gray-900">SA {mesure.semaine_amenorrhee}</p>
                        <p className="text-xs text-gray-500">{format(new Date(mesure.date_mesure), 'dd MMM yyyy', { locale: fr })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{mesure.source}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {mesure.taille_estimee_cm && (
                        <p className="text-gray-600">📏 {mesure.taille_estimee_cm} cm</p>
                      )}
                      {mesure.poids_estime_g && (
                        <p className="text-gray-600">⚖️ {mesure.poids_estime_g} g</p>
                      )}
                      {mesure.perimetre_cranien_mm && (
                        <p className="text-gray-600">PC: {mesure.perimetre_cranien_mm} mm</p>
                      )}
                      {mesure.longueur_femorale_mm && (
                        <p className="text-gray-600">LF: {mesure.longueur_femorale_mm} mm</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </button>
      )}

      {/* Bouton ajouter mesure */}
      <Button
        onClick={() => setShowAjouterDev(true)}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 h-12"
      >
        <Plus className="w-4 h-4 mr-2" />
        Enregistrer une mesure
      </Button>

      {/* Échographies - Accordéon */}
      {grossesse?.echographies && grossesse.echographies.length > 0 && (
        <button
          onClick={() => setShowEchos(!showEchos)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Mes échographies</p>
                <p className="text-xs text-gray-500">{grossesse.echographies.length} enregistrée(s)</p>
              </div>
            </div>
            {showEchos ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>

          {showEchos && (
            <div className="mt-4 space-y-2 border-t pt-3">
              {grossesse.echographies.map((echo, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{echo.type}</p>
                      <p className="text-xs text-gray-500">{new Date(echo.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">T{echo.trimestre}</Badge>
                  </div>
                  {echo.poids_estime && <p className="text-xs text-gray-600 mt-1">Poids: {echo.poids_estime}g</p>}
                </div>
              ))}
            </div>
          )}
        </button>
      )}

      {showAjouterDev && (
        <AjouterDeveloppementBebe
          grossesse={grossesse}
          semainesGrossesse={semainesGrossesse}
          onClose={() => setShowAjouterDev(false)}
        />
      )}
    </div>
  );
}