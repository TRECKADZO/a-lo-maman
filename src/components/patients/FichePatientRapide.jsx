import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Baby, 
  AlertCircle, 
  Calendar, 
  MessageSquare,
  FileText,
  Syringe
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FichePatientRapide({ 
  patient, 
  prochainRdv, 
  derniereConsultation,
  onVoirDossier,
  onContacter,
  calculateAge 
}) {
  const hasAllergies = patient.allergies && patient.allergies.length > 0;
  const hasChronicConditions = patient.maladies_chroniques && patient.maladies_chroniques.length > 0;
  const nbVaccins = patient.vaccins?.length || 0;
  const nbDocuments = patient.documents_medicaux?.length || 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all border-none active:scale-[0.98] overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            {patient.photo ? (
              <img src={patient.photo} alt={patient.prenom} className="w-full h-full rounded-full object-cover" />
            ) : (
              <Baby className="w-6 h-6 md:w-7 md:h-7 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg truncate">
              {patient.prenom} {patient.nom}
            </CardTitle>
            <p className="text-xs md:text-sm text-gray-600 truncate">
              {calculateAge(patient.date_naissance)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {/* Infos essentielles */}
        <div className="grid grid-cols-2 gap-2">
          {patient.numero_cmu && (
            <div className="text-xs">
              <span className="text-gray-600">CMU: </span>
              <span className="font-medium truncate block">{patient.numero_cmu}</span>
            </div>
          )}
          {patient.groupe_sanguin && (
            <div className="text-xs">
              <span className="text-gray-600">Groupe: </span>
              <Badge className="bg-red-100 text-red-800 text-xs">{patient.groupe_sanguin}</Badge>
            </div>
          )}
        </div>

        {/* Alertes */}
        {hasAllergies && (
          <div className="p-2 bg-red-50 border border-red-200 rounded overflow-hidden">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Allergies</p>
                <p className="text-xs text-red-800 line-clamp-2 break-words">
                  {patient.allergies.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prochain RDV */}
        {prochainRdv && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded overflow-hidden">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-blue-900 mb-1">Prochain RDV</p>
                <p className="text-xs text-blue-800 truncate">
                  {isToday(new Date(prochainRdv.date_rdv)) && "Aujourd'hui "}
                  {isTomorrow(new Date(prochainRdv.date_rdv)) && "Demain "}
                  {format(new Date(prochainRdv.date_rdv), 'HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Syringe className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">{nbVaccins} vaccins</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 truncate">{nbDocuments} docs</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onContacter(patient);
            }}
            className="flex-1 active:scale-95 transition-transform"
          >
            <MessageSquare className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate text-xs md:text-sm">Message</span>
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVoirDossier(patient);
            }}
            className="flex-1 bg-teal-600 hover:bg-teal-700 active:scale-95 transition-transform"
          >
            <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate text-xs md:text-sm">Dossier</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}