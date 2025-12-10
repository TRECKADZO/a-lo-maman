import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function GestionAutorisationsDMP() {
  const [selectedConsent, setSelectedConsent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: consentements = [] } = useQuery({
    queryKey: ['consentements_dmp', user?.email],
    queryFn: () => base44.entities.ConsentementBPPC.filter({ 
      patient_email: user.email 
    }),
    enabled: !!user,
  });

  const { data: cliniques = [] } = useQuery({
    queryKey: ['cliniques'],
    queryFn: () => base44.entities.Clinique.list(),
  });

  const { data: demandes = [] } = useQuery({
    queryKey: ['demandes_acces', user?.email],
    queryFn: () => base44.entities.Notification.filter({
      user_email: user.email,
      type: 'demande_acces_dmp',
      lu: false
    }),
    enabled: !!user,
  });

  const createConsentMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ConsentementBPPC.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['consentements_dmp']);
      toast.success('Autorisation enregistrée');
      setDialogOpen(false);
    },
  });

  const updateConsentMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.ConsentementBPPC.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['consentements_dmp']);
      toast.success('Autorisation mise à jour');
    },
  });

  const repondreDemandemutation = useMutation({
    mutationFn: async ({ demande, accepte }) => {
      if (accepte) {
        await base44.entities.ConsentementBPPC.create({
          patient_email: user.email,
          policy_type: 'opt-in',
          scope: 'document-sharing',
          status: 'active',
          decision: 'permit',
          date_time: new Date().toISOString(),
          provision: {
            type: 'permit',
            actors: [{
              role: 'organization',
              reference: demande.metadata?.clinique_id
            }],
            actions: ['access', 'use'],
            purpose: ['TREAT']
          },
          verification: {
            verified: true,
            verification_date: new Date().toISOString(),
            verified_by: user.email,
            method: 'electronic'
          }
        });
      }
      
      await base44.entities.Notification.update(demande.id, { lu: true });
    },
    onSuccess: (_, { accepte }) => {
      queryClient.invalidateQueries(['consentements_dmp']);
      queryClient.invalidateQueries(['demandes_acces']);
      toast.success(accepte ? 'Accès autorisé' : 'Demande refusée');
    },
  });

  const revoquerAcces = async (consentement) => {
    await updateConsentMutation.mutateAsync({
      id: consentement.id,
      data: {
        status: 'inactive',
        decision: 'deny'
      }
    });
  };

  const getClinicName = (cliniqueId) => {
    const clinique = cliniques.find(c => c.id === cliniqueId);
    return clinique?.nom || 'Établissement inconnu';
  };

  const autorisationsActives = consentements.filter(c => 
    c.status === 'active' && c.decision === 'permit'
  );

  const autorisationsRevoquees = consentements.filter(c => 
    c.status === 'inactive' || c.decision === 'deny'
  );

  return (
    <div className="space-y-6">
      {/* Demandes en attente */}
      {demandes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Demandes d'accès en attente ({demandes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demandes.map((demande) => (
              <div key={demande.id} className="p-4 bg-white rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{demande.titre}</p>
                    <p className="text-sm text-gray-600">{demande.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(demande.created_date).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => repondreDemandemutation.mutate({ demande, accepte: true })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Autoriser
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => repondreDemandemutation.mutate({ demande, accepte: false })}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Autorisations actives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autorisations d'accès à mon DMP ({autorisationsActives.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {autorisationsActives.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune autorisation active
            </p>
          ) : (
            autorisationsActives.map((consent) => {
              const cliniqueId = consent.provision?.actors?.[0]?.reference;
              const cliniqueName = getClinicName(cliniqueId);
              
              return (
                <div key={consent.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{cliniqueName}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-800">
                            <Unlock className="w-3 h-3 mr-1" />
                            Accès autorisé
                          </Badge>
                          <Badge variant="outline">{consent.scope}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Autorisé le {new Date(consent.date_time).toLocaleDateString('fr-FR')}
                          </p>
                          {consent.expiration_date && (
                            <p>Expire le {new Date(consent.expiration_date).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConsent(consent);
                          setDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => revoquerAcces(consent)}
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Révoquer
                      </Button>
                    </div>
                  </div>

                  {/* Permissions détaillées */}
                  <div className="text-xs bg-gray-50 p-3 rounded mt-2">
                    <p className="font-semibold mb-2">Permissions accordées:</p>
                    <div className="flex flex-wrap gap-2">
                      {consent.provision?.actions?.map((action) => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {action === 'access' && '👁️ Consultation'}
                          {action === 'use' && '📋 Utilisation'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Autorisations révoquées */}
      {autorisationsRevoquees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600">
              <EyeOff className="w-5 h-5" />
              Accès révoqués ({autorisationsRevoquees.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {autorisationsRevoquees.map((consent) => {
              const cliniqueId = consent.provision?.actors?.[0]?.reference;
              const cliniqueName = getClinicName(cliniqueId);
              
              return (
                <div key={consent.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{cliniqueName}</p>
                        <p className="text-xs text-gray-500">
                          Révoqué le {new Date(consent.updated_date || consent.date_time).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Révoqué</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Dialog détails */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'autorisation</DialogTitle>
            <DialogDescription>
              Informations complètes sur cette autorisation d'accès
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsent && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Établissement autorisé</p>
                <p>{getClinicName(selectedConsent.provision?.actors?.[0]?.reference)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedConsent.provision?.actions?.map((action) => (
                    <Badge key={action}>{action}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Finalités:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedConsent.provision?.purpose?.map((purpose) => (
                    <Badge key={purpose} variant="outline">{purpose}</Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>Date: {new Date(selectedConsent.date_time).toLocaleString('fr-FR')}</p>
                <p>Statut: {selectedConsent.status}</p>
                <p>Décision: {selectedConsent.decision}</p>
                {selectedConsent.expiration_date && (
                  <p>Expiration: {new Date(selectedConsent.expiration_date).toLocaleDateString('fr-FR')}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}