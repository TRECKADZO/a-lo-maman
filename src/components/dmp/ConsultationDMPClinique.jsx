import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Eye,
  Download,
  Search,
  Lock,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function ConsultationDMPClinique({ cliniqueId }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const queryClient = useQueryClient();

  const { data: clinique } = useQuery({
    queryKey: ['clinique', cliniqueId],
    queryFn: () => base44.entities.Clinique.filter({ id: cliniqueId }).then(r => r[0]),
    enabled: !!cliniqueId,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients_clinique', cliniqueId, searchEmail],
    queryFn: async () => {
      const rdvs = await base44.entities.RendezVous.list();
      const professionnels = await base44.entities.Professionnel.list();
      
      const prosClinic = professionnels.filter(p => 
        clinique?.administrateurs?.includes(p.email)
      );
      
      const rdvsClinic = rdvs.filter(r => 
        prosClinic.some(p => p.id === r.professionnel_id)
      );
      
      const patientEmails = [...new Set(rdvsClinic.map(r => r.created_by))];
      
      if (searchEmail) {
        return patientEmails.filter(email => 
          email.toLowerCase().includes(searchEmail.toLowerCase())
        );
      }
      
      return patientEmails;
    },
    enabled: !!clinique,
  });

  const { data: documentsPatient = [] } = useQuery({
    queryKey: ['documents_dmp_patient', selectedPatient],
    queryFn: () => base44.entities.DocumentXDS.filter({ 
      patient_email: selectedPatient 
    }),
    enabled: !!selectedPatient,
  });

  const { data: consentements = [] } = useQuery({
    queryKey: ['consentements_patient', selectedPatient],
    queryFn: () => base44.entities.ConsentementBPPC.filter({ 
      patient_email: selectedPatient 
    }),
    enabled: !!selectedPatient,
  });

  const demanderAccesMutation = useMutation({
    mutationFn: async ({ patientEmail }) => {
      await base44.entities.Notification.create({
        user_email: patientEmail,
        type: 'demande_acces_dmp',
        titre: 'Demande d\'accès DMP',
        message: `${clinique.nom} demande l'accès à votre DMP`,
        priority: 'haute',
        lien: '/pages/MonEspaceSante',
        metadata: { clinique_id: cliniqueId },
        lu: false
      });
    },
    onSuccess: () => {
      toast.success('Demande d\'accès envoyée au patient');
      queryClient.invalidateQueries(['consentements_patient']);
    },
  });

  const consulterDocumentMutation = useMutation({
    mutationFn: async ({ documentId }) => {
      const doc = await base44.entities.DocumentXDS.filter({ id: documentId }).then(r => r[0]);
      
      await base44.entities.Notification.create({
        user_email: doc.patient_email,
        type: 'consultation_dmp',
        titre: 'Consultation DMP',
        message: `${clinique.nom} a consulté le document "${doc.title}"`,
        priority: 'moyenne',
        lien: '/pages/Interoperabilite',
        metadata: { document_id: documentId, clinique_id: cliniqueId },
        lu: false
      });
      
      return doc;
    },
    onSuccess: (doc) => {
      setSelectedDocument(doc);
    },
  });

  const hasAccess = (patientEmail) => {
    return consentements.some(c => 
      c.patient_email === patientEmail &&
      c.status === 'active' &&
      c.decision === 'permit' &&
      c.scope === 'document-sharing'
    );
  };

  const getDocumentIcon = (classCode) => {
    if (classCode?.includes('11369-6')) return '📋';
    if (classCode?.includes('34133-9')) return '📊';
    if (classCode?.includes('18842-5')) return '💊';
    return '📄';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Consultation DMP Patients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un patient par email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {patients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun patient trouvé</p>
          ) : (
            <div className="space-y-2">
              {patients.map((patientEmail) => {
                const access = hasAccess(patientEmail);
                return (
                  <div
                    key={patientEmail}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {patientEmail[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{patientEmail}</p>
                        {access ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Accès autorisé
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" />
                            Accès non autorisé
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {access ? (
                      <Button onClick={() => setSelectedPatient(patientEmail)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Consulter DMP
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => demanderAccesMutation.mutate({ patientEmail })}
                        disabled={demanderAccesMutation.isPending}
                      >
                        Demander accès
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog DMP Patient */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DMP de {selectedPatient}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {documentsPatient.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun document dans le DMP</p>
            ) : (
              <div className="grid gap-3">
                {documentsPatient.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{getDocumentIcon(doc.class_code)}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{doc.title}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline">{doc.format_code}</Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                {doc.practice_setting_code}
                              </Badge>
                              {doc.confidentiality === 'R' && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Restreint
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Créé le {new Date(doc.creation_time).toLocaleDateString('fr-FR')}
                              </p>
                              {doc.author?.name && (
                                <p>Auteur: {doc.author.name} ({doc.author.institution})</p>
                              )}
                              <p>Taille: {(doc.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => consulterDocumentMutation.mutate({ documentId: doc.id })}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Détails Document */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document DMP</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold mb-2">{selectedDocument.title}</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Type:</strong> {selectedDocument.type_code}</p>
                  <p><strong>Format:</strong> {selectedDocument.format_code}</p>
                  <p><strong>Date:</strong> {new Date(selectedDocument.creation_time).toLocaleString('fr-FR')}</p>
                  <p><strong>Confidentialité:</strong> {selectedDocument.confidentiality === 'N' ? 'Normal' : 'Restreint'}</p>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Consultation tracée</p>
                    <p>Cette consultation a été enregistrée et le patient en sera notifié conformément au RGPD.</p>
                  </div>
                </div>
              </div>

              {selectedDocument.file_uri && (
                <Button className="w-full" onClick={() => window.open(selectedDocument.file_uri, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le document
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}