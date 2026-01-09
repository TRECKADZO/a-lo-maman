import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  FileText,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ConsulterDMPProfessionnel({ patientEmail, professionnelId, onClose }) {
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Récupérer le consentement DMP du patient
  const { data: consentement, isLoading: loadingConsentement } = useQuery({
    queryKey: ['consentement_dmp', patientEmail],
    queryFn: async () => {
      const consentements = await base44.entities.ConsentementBPPC.filter({
        patient_email: patientEmail,
        type_consentement: 'acces_dmp'
      }, '-date_consentement');
      return consentements[0] || null;
    },
    enabled: !!patientEmail,
  });

  // Récupérer les documents DMP
  const { data: documentsDMP = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['documents_dmp', patientEmail],
    queryFn: async () => {
      if (!consentement || consentement.statut !== 'actif') return [];
      return await base44.entities.DocumentXDS.filter({
        patient_email: patientEmail
      }, '-date_creation');
    },
    enabled: !!patientEmail && !!consentement && consentement.statut === 'actif',
  });

  // Demander l'accès au DMP
  const demanderAccesMutation = useMutation({
    mutationFn: async () => {
      // Créer une demande de consentement
      return await base44.entities.ConsentementBPPC.create({
        patient_email: patientEmail,
        type_consentement: 'acces_dmp',
        professionnel_demandeur_id: professionnelId,
        statut: 'en_attente',
        date_consentement: new Date().toISOString(),
        duree_validite_jours: 365,
        motif_demande: 'Consultation du dossier médical pour suivi patient',
        autorisations: {
          lecture: true,
          ecriture: true,
          consultation_historique: true,
          partage_externes: false
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentement_dmp'] });
    },
  });

  // Télécharger un document
  const telechargerDocument = async (doc) => {
    try {
      if (doc.document_uri) {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: doc.document_uri,
          expires_in: 300
        });
        window.open(signed_url, '_blank');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  if (loadingConsentement) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Vérification des autorisations DMP...</p>
        </CardContent>
      </Card>
    );
  }

  // Pas de consentement ou refusé
  if (!consentement || consentement.statut === 'refuse') {
    return (
      <Card className="shadow-lg border-2 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-orange-600" />
            Accès au DMP non autorisé
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert className="bg-orange-50 border-orange-300">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <AlertDescription className="text-orange-900">
              Le patient n'a pas encore autorisé l'accès à son Dossier Médical Partagé.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Pour consulter le DMP de ce patient, vous devez d'abord demander son autorisation.
              Le patient recevra une notification et pourra accepter ou refuser votre demande.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">✓ Avec l'accès au DMP, vous pourrez :</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Consulter l'historique médical complet</li>
                <li>• Voir les documents médicaux partagés</li>
                <li>• Ajouter de nouveaux documents au dossier</li>
                <li>• Synchroniser automatiquement les données</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={() => demanderAccesMutation.mutate()}
            disabled={demanderAccesMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {demanderAccesMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi de la demande...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Demander l'accès au DMP
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Consentement en attente
  if (consentement.statut === 'en_attente') {
    return (
      <Card className="shadow-lg border-2 border-yellow-200">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardTitle className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-600" />
            Demande d'accès en attente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="bg-yellow-50 border-yellow-300">
            <Clock className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              Votre demande d'accès au DMP a été envoyée au patient le{' '}
              {format(new Date(consentement.date_consentement), 'dd MMMM yyyy', { locale: fr })}.
              En attente de validation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Accès autorisé - afficher le DMP
  return (
    <div className="space-y-6">
      {/* Header avec statut */}
      <Card className="shadow-lg border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              Dossier Médical Partagé (DMP)
            </CardTitle>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Accès autorisé
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Autorisation accordée le</p>
              <p className="font-semibold">
                {format(new Date(consentement.date_consentement), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Validité</p>
              <p className="font-semibold">
                {consentement.duree_validite_jours} jours
              </p>
            </div>
          </div>
          
          {consentement.autorisations && (
            <div className="mt-4 flex flex-wrap gap-2">
              {consentement.autorisations.lecture && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Lecture
                </Badge>
              )}
              {consentement.autorisations.ecriture && (
                <Badge variant="outline" className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Écriture
                </Badge>
              )}
              {consentement.autorisations.consultation_historique && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Historique complet
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents DMP */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Documents médicaux ({documentsDMP.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des documents...</p>
            </div>
          ) : documentsDMP.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun document médical partagé</p>
            </div>
          ) : (
            <Tabs defaultValue="tous" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tous">Tous</TabsTrigger>
                <TabsTrigger value="resultats">Résultats</TabsTrigger>
                <TabsTrigger value="ordonnances">Ordonnances</TabsTrigger>
                <TabsTrigger value="comptes_rendus">CR</TabsTrigger>
              </TabsList>

              {['tous', 'resultats', 'ordonnances', 'comptes_rendus'].map(type => (
                <TabsContent key={type} value={type} className="space-y-3">
                  {documentsDMP
                    .filter(doc => type === 'tous' || doc.type_document === type.slice(0, -1))
                    .map(doc => (
                      <div
                        key={doc.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-teal-600" />
                              <h4 className="font-semibold">{doc.titre}</h4>
                              <Badge variant="outline" className="text-xs">
                                {doc.type_document}
                              </Badge>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                {format(new Date(doc.date_creation), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                              {doc.auteur && <span>Par: {doc.auteur}</span>}
                              {doc.format && <span>Format: {doc.format.toUpperCase()}</span>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              telechargerDocument(doc);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}