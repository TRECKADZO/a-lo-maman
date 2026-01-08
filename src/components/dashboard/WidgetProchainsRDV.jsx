import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Stethoscope, ArrowRight } from "lucide-react";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WidgetProchainsRDV({ rendezVous, professionnels, onRemove }) {
  const rdvActifs = rendezVous?.filter(r => 
    new Date(r.date_rdv) > new Date() && r.statut !== 'annule'
  ).slice(0, 3) || [];

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Prochains RDV
          </h3>
          <Badge className="bg-blue-600 text-white">{rdvActifs.length}</Badge>
        </div>

        <div className="space-y-3">
          {rdvActifs.length > 0 ? (
            <>
              {rdvActifs.map((rdv) => {
                const pro = professionnels?.find(p => p.id === rdv.professionnel_id);
                const dateRdv = new Date(rdv.date_rdv);
                const joursRestants = differenceInDays(dateRdv, new Date());
                
                return (
                  <div key={rdv.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">
                          {format(dateRdv, 'EEE d MMM', { locale: fr })} à {format(dateRdv, 'HH:mm')}
                        </p>
                        {pro && (
                          <p className="text-xs text-gray-600 truncate">
                            Dr. {pro.nom_complet}
                          </p>
                        )}
                        <Badge variant="outline" className="text-xs mt-1">
                          {isToday(dateRdv) ? "Aujourd'hui" : 
                           isTomorrow(dateRdv) ? 'Demain' : 
                           `Dans ${joursRestants}j`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button asChild variant="outline" className="w-full">
                <Link to={createPageUrl('Teleconsultation')}>
                  Voir tous mes RDV
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Aucun RDV planifié</p>
              <Button asChild size="sm">
                <Link to={createPageUrl('Teleconsultation')}>
                  Prendre RDV
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}