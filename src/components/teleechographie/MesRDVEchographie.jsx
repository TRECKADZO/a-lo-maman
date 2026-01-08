import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, MapPin, Clock, FileText, 
  Image as ImageIcon, Download, CheckCircle, 
  AlertCircle, Eye
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MesRDVEchographie({ onViewRapport }) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rdvs = [], isLoading } = useQuery({
    queryKey: ['rdv_teleecho', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.RDVTeleEchographie.filter(
        { maman_email: user.email },
        '-date_rdv'
      );
    },
    enabled: !!user,
  });

  const { data: centres = [] } = useQuery({
    queryKey: ['centres_teleecho'],
    queryFn: () => base44.entities.CentreTeleEchographie.filter({ actif: true }),
  });

  const rdvAVenir = rdvs.filter(r => !isPast(new Date(r.date_rdv)) && r.statut !== 'termine' && r.statut !== 'annule');
  const rdvPasses = rdvs.filter(r => isPast(new Date(r.date_rdv)) || r.statut === 'termine');

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'termine':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case 'confirme':
        return <Badge className="bg-blue-100 text-blue-800">Confirmé</Badge>;
      case 'planifie':
        return <Badge className="bg-orange-100 text-orange-800">Planifié</Badge>;
      case 'annule':
        return <Badge className="bg-gray-100 text-gray-800">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* RDV à venir */}
      {rdvAVenir.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rendez-vous à venir ({rdvAVenir.length})
          </h3>
          <div className="space-y-3">
            {rdvAVenir.map(rdv => {
              const centre = centres.find(c => c.id === rdv.centre_id);
              return (
                <Card key={rdv.id} className="shadow-lg border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-pink-100 text-pink-800">
                          {rdv.type_echographie}
                        </Badge>
                        {getStatutBadge(rdv.statut)}
                      </div>
                      <Badge variant="outline">SA {rdv.semaine_grossesse}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">
                          {format(new Date(rdv.date_rdv), 'EEEE d MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{format(new Date(rdv.date_rdv), 'HH:mm', { locale: fr })}</span>
                      </div>
                      {centre && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{centre.nom_centre}, {centre.ville}</span>
                        </div>
                      )}
                    </div>

                    {rdv.instructions_pre_rdv && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-900 font-semibold mb-1">
                          Instructions avant l'examen :
                        </p>
                        <p className="text-xs text-blue-800">{rdv.instructions_pre_rdv}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* RDV passés avec rapports */}
      {rdvPasses.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Échographies réalisées ({rdvPasses.length})
          </h3>
          <div className="space-y-3">
            {rdvPasses.map(rdv => {
              const centre = centres.find(c => c.id === rdv.centre_id);
              const hasRapport = rdv.rapport_echographie && rdv.rapport_echographie.rapport_pdf_url;
              
              return (
                <Card key={rdv.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge className="bg-purple-100 text-purple-800 mb-2">
                          {rdv.type_echographie}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(rdv.date_rdv), 'd MMMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-gray-600">{centre?.nom_centre}</p>
                      </div>
                      {hasRapport && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Rapport disponible
                        </Badge>
                      )}
                    </div>

                    {hasRapport ? (
                      <div className="space-y-2">
                        {rdv.rapport_echographie.biometrie && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Biométrie fœtale :</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {rdv.rapport_echographie.biometrie.BIP && (
                                <div><span className="text-gray-600">BIP:</span> <span className="font-semibold">{rdv.rapport_echographie.biometrie.BIP} mm</span></div>
                              )}
                              {rdv.rapport_echographie.biometrie.LF && (
                                <div><span className="text-gray-600">LF:</span> <span className="font-semibold">{rdv.rapport_echographie.biometrie.LF} mm</span></div>
                              )}
                              {rdv.rapport_echographie.biometrie.EPF && (
                                <div><span className="text-gray-600">Poids estimé:</span> <span className="font-semibold">{rdv.rapport_echographie.biometrie.EPF} g</span></div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => window.open(rdv.rapport_echographie.rapport_pdf_url, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            onClick={() => onViewRapport && onViewRapport(rdv)}
                            className="bg-pink-500"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Rapport en attente</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {rdvs.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune échographie programmée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}