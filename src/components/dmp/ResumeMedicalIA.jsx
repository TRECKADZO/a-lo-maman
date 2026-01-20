import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, FileText, AlertTriangle, TrendingUp, Loader2, Calendar, Pill } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function ResumeMedicalIA({ patientEmail }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['documents_patient', patientEmail],
    queryFn: () => base44.entities.DocumentMedical.filter({ patient_email: patientEmail })
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ['consultations_patient', patientEmail],
    queryFn: () => base44.entities.RendezVous.filter({ 
      patient_email: patientEmail, 
      statut: 'termine' 
    })
  });

  const { data: ordonnances = [] } = useQuery({
    queryKey: ['ordonnances_patient', patientEmail],
    queryFn: () => base44.entities.Ordonnance.filter({ patient_email: patientEmail })
  });

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume_medical_ia', patientEmail, documents.length, consultations.length],
    queryFn: async () => {
      if (documents.length === 0 && consultations.length === 0) {
        return null;
      }

      const contexte = {
        nombre_documents: documents.length,
        types_documents: [...new Set(documents.map(d => d.type_document))],
        derniers_documents: documents.slice(0, 5).map(d => ({
          type: d.type_document,
          titre: d.titre,
          date: d.date_document
        })),
        nombre_consultations: consultations.length,
        dernieres_consultations: consultations.slice(0, 3).map(c => ({
          type: c.type_consultation,
          date: c.date_rdv,
          notes: c.notes_professionnel
        })),
        ordonnances_actives: ordonnances.filter(o => {
          const date = new Date(o.date_emission);
          const maintenant = new Date();
          const diff = (maintenant - date) / (1000 * 60 * 60 * 24);
          return diff < 90;
        }).length
      };

      const prompt = `En tant qu'assistant médical IA, génère un résumé intelligent et structuré de l'historique médical de ce patient:

${JSON.stringify(contexte, null, 2)}

Fournis un résumé au format JSON avec:
1. vue_ensemble: résumé général en 2-3 phrases
2. points_cles: array de 3-5 points médicaux importants
3. alertes_potentielles: array d'alertes ou points d'attention (ex: examens manquants, suivi recommandé)
4. tendances: observations sur l'évolution de la santé du patient
5. recommandations: 2-3 recommandations pour le suivi médical

Sois précis, factuel et professionnel.`;

      return await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            vue_ensemble: { type: 'string' },
            points_cles: { type: 'array', items: { type: 'string' } },
            alertes_potentielles: { type: 'array', items: { type: 'string' } },
            tendances: { type: 'string' },
            recommandations: { type: 'array', items: { type: 'string' } }
          }
        }
      });
    },
    enabled: documents.length > 0 || consultations.length > 0,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Génération du résumé médical par IA...</p>
        </CardContent>
      </Card>
    );
  }

  if (!resume) {
    return (
      <Card className="shadow-lg border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune donnée médicale disponible pour générer un résumé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Résumé Médical Intelligent
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Vue d'ensemble */}
        <div className="p-4 bg-purple-50 rounded-xl">
          <p className="text-purple-900 leading-relaxed">{resume.vue_ensemble}</p>
        </div>

        {/* Points clés */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Points Clés
          </h3>
          <div className="space-y-2">
            {resume.points_cles?.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm text-blue-900">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        {resume.alertes_potentielles && resume.alertes_potentielles.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription>
              <p className="font-semibold text-orange-900 mb-2">Points d'attention</p>
              <ul className="space-y-1">
                {resume.alertes_potentielles.map((alerte, idx) => (
                  <li key={idx} className="text-sm text-orange-800">• {alerte}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Tendances */}
        {resume.tendances && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Tendances & Évolution
            </h3>
            <p className="text-sm text-gray-700 p-3 bg-green-50 rounded-lg">{resume.tendances}</p>
          </div>
        )}

        {/* Recommandations */}
        {resume.recommandations && resume.recommandations.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Recommandations
            </h3>
            <div className="space-y-2">
              {resume.recommandations.map((reco, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-600 font-bold">→</span>
                  <p className="text-purple-900">{reco}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            <p className="text-xs text-gray-600">Documents</p>
          </div>
          <div className="text-center">
            <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{consultations.length}</p>
            <p className="text-xs text-gray-600">Consultations</p>
          </div>
          <div className="text-center">
            <Pill className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{ordonnances.length}</p>
            <p className="text-xs text-gray-600">Ordonnances</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}