import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, MapPin, Phone, Mail, Users, BarChart3, Zap } from 'lucide-react';

export default function CarteCentre({ centre, onEdit }) {
  const isClinic = !!centre.type_etablissement;
  
  const getStatutBadge = () => {
    if (isClinic) {
      if (centre.statut_validation === 'approuve') return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      if (centre.statut_validation === 'en_attente') return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle };
      return { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle };
    } else {
      return centre.actif 
        ? { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
        : { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    }
  };

  const badgeInfo = getStatutBadge();
  const BadgeIcon = badgeInfo.icon;

  const nom = centre.nom || centre.nom_centre;
  const email = centre.email_contact;
  const ville = centre.ville;
  const region = centre.region;

  return (
    <Card className="shadow-lg border-none hover:shadow-xl transition-all group">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header avec titre et statut */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate">{nom}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {centre.type_etablissement?.replace(/_/g, ' ') || 'Centre de santé'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Badge className={`${badgeInfo.bg} ${badgeInfo.text} flex items-center gap-1 whitespace-nowrap`}>
                <BadgeIcon className="w-4 h-4" />
                {isClinic ? centre.statut_validation : (centre.actif ? 'Actif' : 'Inactif')}
              </Badge>
            </div>
          </div>

          {/* Infos de localisation et contact */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{ville}, {region}</span>
            </div>
            {email && (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {centre.telephone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{centre.telephone}</span>
              </div>
            )}
          </div>

          {/* Services/Types offerts */}
          {(centre.services_offerts || centre.types_echographie) && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Services:</p>
              <div className="flex flex-wrap gap-2">
                {(centre.services_offerts || centre.types_echographie)?.slice(0, 3).map((service, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {service.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {(centre.services_offerts?.length || centre.types_echographie?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(centre.services_offerts?.length || centre.types_echographie?.length || 0) - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Stats et intégrations */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            {centre.statistiques?.consultations !== undefined && (
              <div className="text-center">
                <BarChart3 className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{centre.statistiques.consultations}</p>
                <p className="text-xs text-gray-600">Consultations</p>
              </div>
            )}
            {centre.statistiques?.taux_satisfaction !== undefined && (
              <div className="text-center">
                <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{centre.statistiques.taux_satisfaction.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Satisfaction</p>
              </div>
            )}
            <div className="text-center">
              <Zap className={`w-4 h-4 mx-auto mb-1 ${centre.api_fhir_enabled ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className="text-lg font-bold">{centre.api_fhir_enabled ? '✓' : '—'}</p>
              <p className="text-xs text-gray-600">FHIR</p>
            </div>
          </div>

          {/* Bouton action */}
          <Button
            onClick={() => onEdit(centre)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Voir détails & Éditer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}