import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Users, Shield, MapPin, Phone, Mail } from 'lucide-react';

const SERVICE_LABELS = {
  consultation_prenatale: 'Consultation prénatale',
  accouchement: 'Accouchement',
  pediatrie: 'Pédiatrie',
  echographie: 'Échographie',
  laboratoire: 'Laboratoire',
  urgences: 'Urgences',
  planification_familiale: 'Planification familiale',
};

const SERVICE_COLORS = {
  consultation_prenatale: 'bg-pink-100 text-pink-800',
  accouchement: 'bg-rose-100 text-rose-800',
  pediatrie: 'bg-blue-100 text-blue-800',
  echographie: 'bg-purple-100 text-purple-800',
  laboratoire: 'bg-green-100 text-green-800',
  urgences: 'bg-red-100 text-red-800',
  planification_familiale: 'bg-orange-100 text-orange-800',
};

export default function AffichageCentreSante({ centre }) {
  const statusConfig = {
    en_attente: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'En attente d\'approbation' },
    approuve: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Approuvé' },
    rejete: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejeté' },
  };

  const Status = statusConfig[centre.statut_validation];

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={`p-4 rounded-lg ${Status.bg} border border-current`}>
        <div className="flex items-center gap-3">
          <Status.icon className={`w-5 h-5 ${Status.color}`} />
          <div>
            <p className={`font-semibold ${Status.color}`}>{Status.label}</p>
            <p className="text-sm text-gray-600">
              {centre.statut_validation === 'en_attente' && 'Votre centre est en cours de validation'}
              {centre.statut_validation === 'approuve' && 'Votre centre est actif'}
              {centre.statut_validation === 'rejete' && 'Veuillez contacter le support'}
            </p>
          </div>
        </div>
      </div>

      {/* Infos du centre */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-2xl">{centre.nom}</CardTitle>
          <Badge variant="outline" className="mt-2">
            {centre.type_etablissement?.replace(/_/g, ' ')}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {centre.adresse && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 flex-shrink-0" />
              <span>{centre.adresse}, {centre.ville} ({centre.region})</span>
            </div>
          )}
          {centre.telephone && (
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5 flex-shrink-0" />
              <span>{centre.telephone}</span>
            </div>
          )}
          {centre.email_contact && (
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-5 h-5 flex-shrink-0" />
              <span>{centre.email_contact}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      {centre.services_offerts?.length > 0 && (
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Services offerts ({centre.services_offerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {centre.services_offerts.map((service) => (
                <Badge
                  key={service}
                  className={SERVICE_COLORS[service] || 'bg-gray-100 text-gray-800'}
                >
                  {SERVICE_LABELS[service] || service}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Administrateurs */}
      {centre.administrateurs?.length > 0 && (
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Administrateurs ({centre.administrateurs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {centre.administrateurs.map((admin) => (
                <div key={admin} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="text-gray-700">{admin}</span>
                  {admin === centre.administrateur_email && (
                    <Badge className="bg-blue-100 text-blue-800">Propriétaire</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}