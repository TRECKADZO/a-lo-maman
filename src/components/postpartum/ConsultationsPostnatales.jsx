import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, Stethoscope } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CONSULTATION_LABELS = {
  'j1_j5': 'Consultation précoce (J1-J5)',
  '6_semaines': 'Examen post-natal (6 semaines)',
  '3_mois': 'Consultation des 3 mois',
  'autre': 'Autre consultation'
};

export default function ConsultationsPostnatales({ suivi }) {
  const consultations = suivi.consultations_postnatales || [];
  const aVenir = consultations.filter(c => c.statut === 'planifie' && !isPast(new Date(c.date_prevue)));
  const realisees = consultations.filter(c => c.statut === 'realise');

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          Consultations post-natales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {aVenir.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">À venir</p>
            {aVenir.map((consult, idx) => (
              <div key={idx} className="bg-blue-50 rounded-lg p-3 mb-2 border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-blue-900">
                      {CONSULTATION_LABELS[consult.type]}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {format(new Date(consult.date_prevue), 'd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-blue-500 text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    À faire
                  </Badge>
                </div>
                <Link to={createPageUrl('Teleconsultation')}>
                  <Button size="sm" className="w-full bg-blue-600 mt-2">
                    Prendre rendez-vous
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {realisees.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Réalisées</p>
            {realisees.map((consult, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-3 mb-2 border border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-green-900">
                      {CONSULTATION_LABELS[consult.type]}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {format(new Date(consult.date_realisee), 'd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-900 border border-purple-200">
          <p className="font-semibold mb-1">💡 À savoir</p>
          <p className="text-xs">
            Les consultations post-natales sont essentielles pour surveiller votre récupération 
            et celle de votre bébé. N'hésitez pas à consulter en cas de questions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}