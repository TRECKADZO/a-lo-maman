import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, Info, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WidgetAlertesIA({ grossesse, enfants, onRemove }) {
  const alertes = [];

  // Alertes grossesse
  if (grossesse) {
    const consultations = grossesse.consultations || [];
    const dernierPoids = consultations.slice(-1)[0]?.poids;
    const avantDernierPoids = consultations.slice(-2)[0]?.poids;
    
    if (dernierPoids && avantDernierPoids && (dernierPoids - avantDernierPoids) > 2) {
      alertes.push({
        type: 'attention',
        titre: 'Prise de poids importante',
        message: 'Gain de plus de 2kg depuis dernière visite',
        lien: createPageUrl('Grossesse')
      });
    }

    const derniereConsult = consultations.slice(-1)[0];
    if (derniereConsult?.tension_arterielle) {
      const [systolique] = derniereConsult.tension_arterielle.split('/').map(n => parseInt(n));
      if (systolique >= 140) {
        alertes.push({
          type: 'urgent',
          titre: 'Tension élevée détectée',
          message: `TA: ${derniereConsult.tension_arterielle} - Consultez rapidement`,
          lien: createPageUrl('Teleconsultation')
        });
      }
    }
  }

  // Alertes enfants - vaccins en retard
  enfants?.forEach(enfant => {
    const vaccinsRetard = (enfant.vaccins_manquants || []).filter(v => 
      new Date(v.date_limite) < new Date()
    );
    if (vaccinsRetard.length > 0) {
      alertes.push({
        type: 'attention',
        titre: `Vaccins en retard - ${enfant.prenom}`,
        message: `${vaccinsRetard.length} vaccin(s) à faire`,
        lien: createPageUrl('Enfants')
      });
    }
  });

  const getAlertIcon = (type) => {
    if (type === 'urgent') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (type === 'attention') return <Info className="w-5 h-5 text-amber-600" />;
    return <CheckCircle className="w-5 h-5 text-blue-600" />;
  };

  const getAlertBg = (type) => {
    if (type === 'urgent') return 'bg-red-50 border-red-200';
    if (type === 'attention') return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Alertes IA
          </h3>
          <Badge className={alertes.length > 0 ? "bg-amber-600 text-white" : "bg-green-600 text-white"}>
            {alertes.length}
          </Badge>
        </div>

        <div className="space-y-3">
          {alertes.length > 0 ? (
            <>
              {alertes.map((alerte, index) => (
                <div key={index} className={`p-3 rounded-xl border ${getAlertBg(alerte.type)}`}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alerte.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{alerte.titre}</p>
                      <p className="text-xs text-gray-600 mt-1">{alerte.message}</p>
                      {alerte.lien && (
                        <Button asChild variant="link" size="sm" className="p-0 h-auto mt-2 text-xs">
                          <Link to={alerte.lien}>
                            En savoir plus →
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Tout va bien !</p>
              <p className="text-xs text-gray-500 mt-1">Aucune alerte détectée</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}