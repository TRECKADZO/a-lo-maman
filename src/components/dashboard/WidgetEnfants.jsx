import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Baby, ArrowRight, Cake } from "lucide-react";
import { differenceInMonths, differenceInYears } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WidgetEnfants({ enfants, onRemove }) {
  const calculateAge = (dateNaissance) => {
    const years = differenceInYears(new Date(), new Date(dateNaissance));
    const months = differenceInMonths(new Date(), new Date(dateNaissance)) % 12;
    
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
    }
    return `${months} mois`;
  };

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-600" />
            Mes Enfants
          </h3>
          <Badge className="bg-blue-600 text-white">{enfants?.length || 0}</Badge>
        </div>

        <div className="space-y-3">
          {enfants && enfants.length > 0 ? (
            <>
              {enfants.slice(0, 4).map((enfant) => (
                <div key={enfant.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {enfant.prenom?.charAt(0) || 'B'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{enfant.prenom}</p>
                        <p className="text-xs text-gray-600">{calculateAge(enfant.date_naissance)}</p>
                      </div>
                    </div>
                    {enfant.vaccins_a_jour === false && (
                      <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                        Vaccins
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to={createPageUrl('Enfants')}>
                  Voir les carnets
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Aucun carnet créé</p>
              <Button asChild size="sm">
                <Link to={createPageUrl('Enfants')}>
                  Créer un carnet
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}