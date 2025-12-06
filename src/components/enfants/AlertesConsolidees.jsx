import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle, Syringe, Activity, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AlertesConsolidees({ alertes }) {
  const alertesParType = {
    vaccin: alertes.filter(a => a.type === 'vaccin'),
    jalon: alertes.filter(a => a.type === 'jalon'),
    croissance: alertes.filter(a => a.type === 'croissance'),
    rendezVous: alertes.filter(a => a.type === 'rendezVous')
  };

  const getIcon = (type) => {
    switch (type) {
      case 'vaccin': return Syringe;
      case 'jalon': return Activity;
      case 'croissance': return TrendingUp;
      case 'rendezVous': return Clock;
      default: return AlertCircle;
    }
  };

  const getColor = (priorite) => {
    switch (priorite) {
      case 'haute': return 'red';
      case 'moyenne': return 'orange';
      case 'basse': return 'yellow';
      default: return 'gray';
    }
  };

  if (alertes.length === 0) {
    return (
      <Card className="border-2 border-dashed border-green-300 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">
            Tout est en ordre ! 🎉
          </h3>
          <p className="text-green-700">
            Aucune alerte pour le moment. Continuez comme ça !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          Toutes les alertes ({alertes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(alertesParType).map(([type, typeAlertes]) => {
            if (typeAlertes.length === 0) return null;
            const Icon = getIcon(type);
            
            return (
              <div key={type}>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {type === 'vaccin' && 'Vaccinations'}
                  {type === 'jalon' && 'Jalons de développement'}
                  {type === 'croissance' && 'Croissance'}
                  {type === 'rendezVous' && 'Rendez-vous'}
                  <Badge variant="outline">{typeAlertes.length}</Badge>
                </h4>
                
                <div className="space-y-2">
                  {typeAlertes.map((alerte, i) => {
                    const couleur = getColor(alerte.priorite);
                    return (
                      <div
                        key={i}
                        className={`p-3 bg-${couleur}-50 border border-${couleur}-200 rounded-lg`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-semibold text-${couleur}-900 text-sm`}>
                              {alerte.enfant} - {alerte.message}
                            </p>
                            <p className={`text-xs text-${couleur}-700 mt-1`}>
                              {alerte.details}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={createPageUrl('Enfants')}>
                              Voir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}