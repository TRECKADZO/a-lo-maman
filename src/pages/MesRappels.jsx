import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Bell,
  Calendar,
  Pill,
  Activity,
  Syringe,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  X,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { format, isBefore, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreerRappel from '@/components/rappels/CreerRappel';
import EditerRappel from '@/components/rappels/EditerRappel';

export default function MesRappels() {
  const queryClient = useQueryClient();
  const [showCreer, setShowCreer] = useState(false);
  const [editingRappel, setEditingRappel] = useState(null);
  const [filter, setFilter] = useState('tous');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rappels = [], isLoading } = useQuery({
    queryKey: ['rappels_sante', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.RappelSante.filter(
        { created_by: user.email, termine: false },
        '-date_heure_rappel'
      );
    },
    enabled: !!user,
  });

  const supprimerRappelMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.RappelSante.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_sante'] });
    }
  });

  const toggleActifMutation = useMutation({
    mutationFn: async ({ id, actif }) => {
      return await base44.entities.RappelSante.update(id, { actif });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_sante'] });
    }
  });

  const typeIcons = {
    'rendez_vous': Calendar,
    'metrique_sante': Activity,
    'medicament': Pill,
    'vaccination': Syringe,
    'renouvellement_prescription': Pill
  };

  const typeColors = {
    'rendez_vous': 'bg-blue-100 text-blue-800',
    'metrique_sante': 'bg-orange-100 text-orange-800',
    'medicament': 'bg-green-100 text-green-800',
    'vaccination': 'bg-purple-100 text-purple-800',
    'renouvellement_prescription': 'bg-pink-100 text-pink-800'
  };

  const rappelsFiltres = rappels.filter(r => {
    if (filter === 'tous') return true;
    return r.type_rappel === filter;
  });

  const rappelsAujourdhui = rappelsFiltres.filter(r => isToday(new Date(r.date_heure_rappel)));
  const rappelsDemain = rappelsFiltres.filter(r => isTomorrow(new Date(r.date_heure_rappel)));
  const rappelsFuturs = rappelsFiltres.filter(r => 
    !isToday(new Date(r.date_heure_rappel)) && 
    !isTomorrow(new Date(r.date_heure_rappel)) &&
    !isBefore(new Date(r.date_heure_rappel), new Date())
  );

  const RappelCard = ({ rappel }) => {
    const TypeIcon = typeIcons[rappel.type_rappel] || Bell;
    const dateRappel = new Date(rappel.date_heure_rappel);
    const isPast = isBefore(dateRappel, new Date());

    return (
      <Card className={`shadow-md hover:shadow-lg transition-shadow overflow-hidden ${!rappel.actif ? 'opacity-60' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-3 ${typeColors[rappel.type_rappel]} rounded-xl flex-shrink-0`}>
                <TypeIcon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1 break-words">
                  {rappel.titre}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {format(dateRappel, 'EEEE d MMMM à HH:mm', { locale: fr })}
                    </span>
                  </div>
                  
                  {rappel.description && (
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2 break-words">
                      {rappel.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge className={typeColors[rappel.type_rappel]}>
                      {rappel.type_rappel.replace(/_/g, ' ')}
                    </Badge>
                    {rappel.frequence !== 'unique' && (
                      <Badge variant="outline" className="text-xs">
                        {rappel.frequence}
                      </Badge>
                    )}
                    {rappel.priorite === 'haute' || rappel.priorite === 'urgente' && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {rappel.priorite}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingRappel(rappel)}
                className="h-8 w-8 active:scale-95 transition-transform"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => toggleActifMutation.mutate({ id: rappel.id, actif: !rappel.actif })}
                className="h-8 w-8 active:scale-95 transition-transform"
              >
                {rappel.actif ? <Bell className="w-4 h-4 text-green-600" /> : <Bell className="w-4 h-4 text-gray-400" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm('Supprimer ce rappel ?')) {
                    supprimerRappelMutation.mutate(rappel.id);
                  }
                }}
                className="h-8 w-8 text-red-600 active:scale-95 transition-transform"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                <Bell className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <span className="break-words">Mes Rappels</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 ml-0 md:ml-16 mt-2 break-words">
              Gérez vos rappels de santé intelligents
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCreer(true)}
            className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg active:scale-95 transition-transform"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="truncate">Nouveau rappel</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-none shadow-md overflow-hidden">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{rappels.length}</p>
                  <p className="text-xs text-gray-600 truncate">Total actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-none shadow-md overflow-hidden">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-green-600">{rappelsAujourdhui.length}</p>
                  <p className="text-xs text-gray-600 truncate">Aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md overflow-hidden">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-purple-600">{rappelsDemain.length}</p>
                  <p className="text-xs text-gray-600 truncate">Demain</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-none shadow-md overflow-hidden">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Pill className="w-6 h-6 md:w-8 md:h-8 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-orange-600">
                    {rappels.filter(r => r.type_rappel === 'medicament').length}
                  </p>
                  <p className="text-xs text-gray-600 truncate">Médicaments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filter === 'tous' ? 'default' : 'outline'}
                onClick={() => setFilter('tous')}
                className="active:scale-95 transition-transform"
              >
                Tous
              </Button>
              {Object.entries(typeIcons).map(([type, Icon]) => (
                <Button
                  key={type}
                  size="sm"
                  variant={filter === type ? 'default' : 'outline'}
                  onClick={() => setFilter(type)}
                  className="flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-xs md:text-sm">{type.replace(/_/g, ' ')}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rappels */}
        <Tabs defaultValue="aujourd-hui">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="aujourd-hui" className="text-xs md:text-sm px-3 py-2">
              Aujourd'hui ({rappelsAujourdhui.length})
            </TabsTrigger>
            <TabsTrigger value="demain" className="text-xs md:text-sm px-3 py-2">
              Demain ({rappelsDemain.length})
            </TabsTrigger>
            <TabsTrigger value="a-venir" className="text-xs md:text-sm px-3 py-2">
              À venir ({rappelsFuturs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aujourd-hui" className="space-y-4 mt-6">
            {rappelsAujourdhui.length > 0 ? (
              rappelsAujourdhui.map(r => <RappelCard key={r.id} rappel={r} />)
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 md:p-12 text-center">
                  <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 break-words">Aucun rappel aujourd'hui</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="demain" className="space-y-4 mt-6">
            {rappelsDemain.length > 0 ? (
              rappelsDemain.map(r => <RappelCard key={r.id} rappel={r} />)
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 md:p-12 text-center">
                  <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 break-words">Aucun rappel demain</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="a-venir" className="space-y-4 mt-6">
            {rappelsFuturs.length > 0 ? (
              rappelsFuturs.map(r => <RappelCard key={r.id} rappel={r} />)
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 md:p-12 text-center">
                  <Clock className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 break-words">Aucun rappel futur</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Info */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-blue-800 break-words">
                <strong>💡 Astuce :</strong> Les rappels sont envoyés par notification push. 
                Assurez-vous d'avoir activé les notifications dans vos paramètres.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showCreer && (
        <CreerRappel onClose={() => setShowCreer(false)} />
      )}

      {editingRappel && (
        <EditerRappel 
          rappel={editingRappel}
          onClose={() => setEditingRappel(null)}
        />
      )}
    </div>
  );
}