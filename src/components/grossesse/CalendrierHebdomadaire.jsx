import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Activity,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from "lucide-react";

const conseilsParSemaine = {
  4: {
    titre: "Début de la grossesse",
    conseils: ["Prenez 400 µg d'acide folique par jour", "Évitez l'alcool et le tabac", "Reposez-vous en cas de fatigue"],
    symptomes: ["Nausées matinales possibles", "Fatigue intense", "Sensibilité des seins"],
    precautions: ["Évitez les aliments crus", "Limitez la caféine"]
  },
  8: {
    titre: "Première consultation prénatale",
    conseils: ["Programmez votre 1ère consultation", "Faites vos premiers examens sanguins", "Inscrivez-vous à la maternité"],
    symptomes: ["Nausées qui persistent", "Envies ou aversions alimentaires", "Fatigue"],
    precautions: ["Prenez vos vitamines prénatales", "Évitez les efforts intenses"]
  },
  12: {
    titre: "Échographie de datation",
    conseils: ["Faites votre échographie du 1er trimestre", "Les nausées commencent à diminuer", "Partagez la nouvelle avec vos proches"],
    symptomes: ["Nausées en diminution", "Énergie qui revient", "Ventre qui commence à s'arrondir"],
    precautions: ["Continuez l'acide folique", "Hydratez-vous bien"]
  },
  16: {
    titre: "Deuxième trimestre commence",
    conseils: ["Profitez de votre regain d'énergie", "Commencez à sentir les premiers mouvements", "Envisagez le yoga prénatal"],
    symptomes: ["Sensation de bien-être", "Premiers mouvements du bébé", "Ventre visible"],
    precautions: ["Portez des vêtements amples", "Évitez de rester debout trop longtemps"]
  },
  20: {
    titre: "Échographie morphologique",
    conseils: ["Échographie détaillée du 2ème trimestre", "Découvrez le sexe si vous le souhaitez", "Bébé bouge beaucoup"],
    symptomes: ["Mouvements réguliers du bébé", "Possible essoufflement", "Maux de dos"],
    precautions: ["Dormez sur le côté gauche", "Faites des exercices de respiration"]
  },
  24: {
    titre: "Milieu de grossesse",
    conseils: ["Test de diabète gestationnel", "Préparez votre plan de naissance", "Inscrivez-vous aux cours de préparation"],
    symptomes: ["Contractions de Braxton Hicks", "Jambes lourdes", "Brûlures d'estomac"],
    precautions: ["Surveillez votre glycémie", "Évitez les repas copieux le soir"]
  },
  28: {
    titre: "Troisième trimestre",
    conseils: ["Vaccination contre la coqueluche", "Consultations mensuelles", "Préparez votre valise"],
    symptomes: ["Fatigue qui revient", "Essoufflement", "Fréquentes envies d'uriner"],
    precautions: ["Reposez-vous fréquemment", "Évitez les longs trajets"]
  },
  32: {
    titre: "Préparation à l'accouchement",
    conseils: ["Échographie du 3ème trimestre", "Finalisez la chambre de bébé", "Pratiquez les exercices de respiration"],
    symptomes: ["Bébé en position tête en bas", "Mouvements très perceptibles", "Contractions irrégulières"],
    precautions: ["Surveillez les signes du travail", "Préparez vos documents"]
  },
  36: {
    titre: "Dernières semaines",
    conseils: ["Consultation pré-accouchement", "Votre valise doit être prête", "Reposez-vous au maximum"],
    symptomes: ["Descente du bébé dans le bassin", "Pression pelvienne", "Impatience"],
    precautions: ["Ayez votre téléphone à portée", "Restez proche de la maternité"]
  },
  39: {
    titre: "À terme",
    conseils: ["Bébé peut arriver à tout moment", "Restez calme et positive", "Surveillez les contractions"],
    symptomes: ["Contractions régulières possibles", "Perte du bouchon muqueux", "Rupture de la poche des eaux"],
    precautions: ["Appelez la maternité si contractions régulières", "Ne mangez pas trop avant l'accouchement"]
  }
};

export default function CalendrierHebdomadaire({ semainesGrossesse, trimestre, grossesse }) {
  const [semaineSelectionnee, setSemaineSelectionnee] = useState(semainesGrossesse);

  const semaineData = conseilsParSemaine[
    Object.keys(conseilsParSemaine)
      .map(Number)
      .sort((a, b) => Math.abs(a - semaineSelectionnee) - Math.abs(b - semaineSelectionnee))[0]
  ];

  const naviguerSemaine = (direction) => {
    const nouvelleSemaine = semaineSelectionnee + direction;
    if (nouvelleSemaine >= 1 && nouvelleSemaine <= 40) {
      setSemaineSelectionnee(nouvelleSemaine);
    }
  };

  const estSemaineActuelle = semaineSelectionnee === semainesGrossesse;

  return (
    <div className="space-y-6">
      {/* Navigation par semaine */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-pink-600" />
              Calendrier de grossesse
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSemaineSelectionnee(semainesGrossesse)}
                disabled={estSemaineActuelle}
              >
                Semaine actuelle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => naviguerSemaine(-1)}
              disabled={semaineSelectionnee <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <p className="text-3xl font-bold text-pink-600">
                  Semaine {semaineSelectionnee}
                </p>
                {estSemaineActuelle && (
                  <Badge className="bg-pink-600">Actuelle</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {semaineSelectionnee < 14 ? '1er trimestre' : semaineSelectionnee < 28 ? '2ème trimestre' : '3ème trimestre'}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => naviguerSemaine(1)}
              disabled={semaineSelectionnee >= 40}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Barre de progression */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500"
                style={{ width: `${(semaineSelectionnee / 40) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Début</span>
              <span>{semaineSelectionnee}/40 semaines</span>
              <span>Terme</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conseils de la semaine */}
      {semaineData && (
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-purple-900">
              {semaineData.titre}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Conseils */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Conseils de la semaine
              </h4>
              <ul className="space-y-2">
                {semaineData.conseils.map((conseil, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{conseil}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Symptômes courants */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Symptômes courants cette semaine
              </h4>
              <div className="space-y-2">
                {semaineData.symptomes.map((symptome, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600">•</span>
                    <span className="text-gray-700">{symptome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Précautions */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Précautions importantes
              </h4>
              <div className="space-y-2">
                {semaineData.precautions.map((precaution, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{precaution}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rendez-vous recommandés */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            Consultations recommandées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { semaine: 8, titre: "1ère consultation prénatale", type: "obligatoire" },
              { semaine: 12, titre: "Échographie de datation", type: "obligatoire" },
              { semaine: 16, titre: "2ème consultation", type: "obligatoire" },
              { semaine: 20, titre: "Échographie morphologique", type: "obligatoire" },
              { semaine: 24, titre: "Test diabète gestationnel", type: "important" },
              { semaine: 28, titre: "Consultation + vaccin coqueluche", type: "obligatoire" },
              { semaine: 32, titre: "Échographie de croissance", type: "obligatoire" },
              { semaine: 36, titre: "Consultation pré-accouchement", type: "obligatoire" },
              { semaine: 39, titre: "Consultation terme", type: "important" }
            ].map((rdv, i) => {
              const estPasse = rdv.semaine < semaineSelectionnee;
              const estProche = Math.abs(rdv.semaine - semaineSelectionnee) <= 2;
              
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-l-4 ${
                    estPasse
                      ? 'bg-gray-50 border-l-gray-400'
                      : estProche
                      ? 'bg-teal-50 border-l-teal-500'
                      : 'bg-white border-l-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{rdv.titre}</p>
                      <p className="text-sm text-gray-600">Semaine {rdv.semaine}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {estPasse && <CheckCircle className="w-5 h-5 text-gray-400" />}
                      {estProche && !estPasse && <AlertCircle className="w-5 h-5 text-teal-600" />}
                      <Badge className={rdv.type === 'obligatoire' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                        {rdv.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}