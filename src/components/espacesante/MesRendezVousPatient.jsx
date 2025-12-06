import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Building2,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MesRendezVousPatient({ userEmail }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('a_venir');

  const { data: rendezVous = [], isLoading } = useQuery({
    queryKey: ['mes_rendez_vous', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.RendezVous.filter({ created_by: userEmail }, '-date_rdv');
    },
    enabled: !!userEmail,
  });

  const now = new Date();
  const rdvAVenir = rendezVous.filter(rdv => new Date(rdv.date_rdv) > now && rdv.statut !== 'annule');
  const rdvPasses = rendezVous.filter(rdv => new Date(rdv.date_rdv) < now || rdv.statut === 'termine');
  const rdvAnnules = rendezVous.filter(rdv => rdv.statut === 'annule');

  const getStatusBadge = (statut) => {
    const badges = {
      'planifie': { label: 'Planifié', color: 'bg-blue-100 text-blue-800', icon: Clock },
      'confirme': { label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'termine': { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      'annule': { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
      'en_cours': { label: 'En cours', color: 'bg-purple-100 text-purple-800', icon: Video }
    };
    const badge = badges[statut] || badges['planifie'];
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      'cabinet': Briefcase,
      'clinique': Building2,
      'hopital': Building2,
      'telephone': Phone,
      'visio': Video
    };
    return icons[type] || Video;
  };

  const RdvCard = ({ rdv }) => {
    const TypeIcon = getTypeIcon(rdv.type_consultation);
    const isPast = new Date(rdv.date_rdv) < now;
    
    return (
      <Card className={`shadow-md hover:shadow-lg transition-shadow ${isPast ? 'bg-gray-50' : 'bg-white'}`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl">
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">Consultation</p>
                    <p className="text-sm text-gray-600">{rdv.type_consultation}</p>
                  </div>
                </div>
                {getStatusBadge(rdv.statut)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <span>{format(new Date(rdv.date_rdv), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>{format(new Date(rdv.date_rdv), 'HH:mm')}</span>
                </div>
                {rdv.adresse_consultation && (
                  <div className="flex items-center gap-2 text-gray-700 md:col-span-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="truncate">{rdv.adresse_consultation}</span>
                  </div>
                )}
              </div>

              {rdv.motif && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Motif : </span>
                    {rdv.motif}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              {rdv.statut === 'termine' && (
                <Button size="sm" variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir documents
                </Button>
              )}
              {rdv.type_consultation === 'visio' && !isPast && rdv.statut !== 'annule' && (
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full">
                  <Video className="w-4 h-4 mr-2" />
                  Rejoindre
                </Button>
              )}
              <Button size="sm" variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contacter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mes rendez-vous</h2>
        <Button onClick={() => navigate(createPageUrl('Teleconsultation'))} className="bg-pink-600 hover:bg-pink-700">
          <Calendar className="w-4 h-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="a_venir">
            À venir ({rdvAVenir.length})
          </TabsTrigger>
          <TabsTrigger value="passes">
            Passés ({rdvPasses.length})
          </TabsTrigger>
          <TabsTrigger value="annules">
            Annulés ({rdvAnnules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="a_venir" className="space-y-4 mt-6">
          {rdvAVenir.length > 0 ? (
            rdvAVenir.map(rdv => <RdvCard key={rdv.id} rdv={rdv} />)
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun rendez-vous à venir</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="passes" className="space-y-4 mt-6">
          {rdvPasses.length > 0 ? (
            rdvPasses.map(rdv => <RdvCard key={rdv.id} rdv={rdv} />)
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune consultation passée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="annules" className="space-y-4 mt-6">
          {rdvAnnules.length > 0 ? (
            rdvAnnules.map(rdv => <RdvCard key={rdv.id} rdv={rdv} />)
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun rendez-vous annulé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}