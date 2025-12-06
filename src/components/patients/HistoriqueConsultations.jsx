import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function HistoriqueConsultations({ consultations = [] }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-sm md:text-base text-gray-600">Aucune consultation enregistrée</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {consultations.map((consult, index) => (
        <Card key={index} className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="font-semibold text-sm md:text-base truncate">
                    {format(new Date(consult.date), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                  <Badge variant="outline" className="text-xs truncate">{consult.type}</Badge>
                </div>

                {consult.diagnostic && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">Diagnostic</p>
                    <p className="text-sm md:text-base font-medium text-gray-900 break-words">
                      {consult.diagnostic || consult.nom_maladie}
                    </p>
                  </div>
                )}

                {consult.traitement && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">Traitement</p>
                    <p className="text-xs md:text-sm text-gray-700 break-words">{consult.traitement}</p>
                  </div>
                )}

                {consult.notes && (
                  <div className="p-2 bg-gray-50 rounded mt-2 overflow-hidden">
                    <p className="text-xs text-gray-700 break-words">{consult.notes}</p>
                  </div>
                )}

                {consult.professionnel && (
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    Par: {consult.professionnel}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}