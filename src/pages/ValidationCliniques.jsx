import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthGuard from '../components/auth/AuthGuard';

export default function ValidationCliniques() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: demandes = [], isLoading } = useQuery({
    queryKey: ['demandes_cliniques'],
    queryFn: async () => {
      const cliniques = await base44.entities.Clinique.list();
      // Afficher les centres approuvés et en attente pour vérification manuelle
      return cliniques.filter(c => c.statut_validation === 'en_attente' || c.statut_validation === 'approuve');
    },
    enabled: user?.role === 'admin'
  });

  const validerDemande = useMutation({
    mutationFn: async ({ cliniqueId, approuver }) => {
      const clinique = demandes.find(d => d.id === cliniqueId);
      
      if (approuver) {
        // 1. Mettre à jour le statut
        await base44.entities.Clinique.update(cliniqueId, {
          statut_validation: 'approuve',
          onboarding_completed: true
        });

        // 2. Inviter l'administrateur comme user de l'app
        try {
          if (clinique.administrateur_email) {
            await base44.users.inviteUser(clinique.administrateur_email, 'user');
            console.log('✅ Utilisateur invité:', clinique.administrateur_email);
          }
        } catch (error) {
          console.warn('⚠️ Erreur invitation utilisateur:', error);
        }

        // 3. Envoyer email de confirmation
        try {
          await base44.integrations.Core.SendEmail({
            to: clinique.email_contact,
            subject: '✅ Votre établissement est validé - A\'lo Maman',
            body: `
              <h2>Bienvenue dans le réseau A'lo Maman !</h2>
              <p>Votre établissement <strong>${clinique.nom}</strong> a été validé avec succès.</p>
              <p><strong>Prochaine étape:</strong> Connectez-vous avec l'email: <strong>${clinique.administrateur_email}</strong></p>
              <p>Vous recevrez un email d'invitation pour créer votre mot de passe.</p>
              <p>Une fois connecté, vous pourrez accéder à votre tableau de bord et gérer vos services.</p>
              <br>
              <p>Code d'invitation du centre: <strong>${clinique.code_invitation}</strong></p>
            `
          });
        } catch (error) {
          console.warn('⚠️ Erreur envoi email:', error);
        }
      } else {
        await base44.entities.Clinique.update(cliniqueId, {
          statut_validation: 'rejete'
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['demandes_cliniques']);
      toast.success(variables.approuver ? '✅ Demande approuvée et invitation envoyée' : '❌ Demande rejetée');
    },
    onError: (error) => {
      console.error('❌ Erreur validation:', error);
      toast.error('Erreur: ' + error.message);
    }
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Validation Cliniques</h1>
              <p className="text-gray-600">Demandes en attente: {demandes.length}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : demandes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">Aucune demande en attente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {demandes.map((demande) => (
                <Card key={demande.id} className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{demande.nom}</CardTitle>
                      <Badge>{demande.type_etablissement.replace(/_/g, ' ')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">N° Agrément MSP</p>
                        <p className="font-semibold">{demande.numero_agrement}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Localisation</p>
                        <p className="font-semibold">{demande.ville}, {demande.region}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact</p>
                        <p className="font-semibold">{demande.email_contact}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Téléphone</p>
                        <p className="font-semibold">{demande.telephone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Services offerts:</p>
                      <div className="flex flex-wrap gap-2">
                        {demande.services_offerts?.map(s => (
                          <Badge key={s} variant="outline">{s.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>



                    {demande.document_agrement && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(demande.document_agrement, '_blank')}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Voir agrément
                        </Button>
                        {demande.document_registre_commerce && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(demande.document_registre_commerce, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir registre
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => validerDemande.mutate({ cliniqueId: demande.id, approuver: true })}
                        disabled={validerDemande.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        onClick={() => validerDemande.mutate({ cliniqueId: demande.id, approuver: false })}
                        disabled={validerDemande.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}