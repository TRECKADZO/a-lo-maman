import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Loader2,
  Send,
  RefreshCw,
  Copy,
  Brain,
  ClipboardCheck
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AIConsultationSummary({ 
  rendezVous,
  consultationNotes = '',
  chatMessages = [],
  sharedDocuments = [],
  onSummarySaved
}) {
  const [generating, setGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');

  const generateSummary = async () => {
    setGenerating(true);
    try {
      // Préparer le contexte pour l'IA
      const context = `
CONSULTATION MÉDICALE - ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}

MOTIF DE CONSULTATION:
${rendezVous.motif || 'Non spécifié'}

NOTES DU SPÉCIALISTE:
${consultationNotes || 'Aucune note'}

ÉCHANGES DURANT LA CONSULTATION:
${chatMessages.filter(m => m.type !== 'system').map(m => `${m.sender}: ${m.content}`).join('\n') || 'Aucun échange écrit'}

DOCUMENTS PARTAGÉS:
${sharedDocuments.map(d => `- ${d.name} (${d.type})`).join('\n') || 'Aucun document'}

NOTES PATIENT:
${rendezVous.notes_patient || 'Aucune note'}
      `.trim();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant médical expert. À partir des notes de consultation ci-dessous, génère un résumé médical structuré et professionnel en français.

${context}

Le résumé doit être conforme aux standards médicaux et inclure UNIQUEMENT les sections pertinentes parmi :
- Motif de consultation
- Anamnèse (ce que rapporte le patient)
- Examen clinique (si mentionné)
- Diagnostic ou hypothèse diagnostique
- Prescription médicamenteuse (si applicable)
- Examens complémentaires prescrits (si applicable)
- Recommandations et conseils
- Suivi recommandé

Sois précis, médical mais compréhensible. N'invente rien, base-toi uniquement sur les informations fournies.`,
        response_json_schema: {
          type: 'object',
          properties: {
            motif: { type: 'string' },
            anamnese: { type: 'string' },
            examen_clinique: { type: 'string' },
            diagnostic: { type: 'string' },
            prescription: { type: 'string' },
            examens_complementaires: { type: 'string' },
            recommandations: { type: 'string' },
            suivi: { type: 'string' },
            resume_court: { type: 'string' }
          }
        }
      });

      setAiSummary(result);
      setEditedSummary(formatSummaryText(result));
    } catch (error) {
      console.error('Erreur génération résumé:', error);
      alert('❌ Impossible de générer le résumé automatique');
    } finally {
      setGenerating(false);
    }
  };

  const formatSummaryText = (summary) => {
    let text = `RÉSUMÉ DE CONSULTATION\n`;
    text += `Date: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n`;
    text += `\n═══════════════════════════════════\n\n`;

    if (summary.motif) {
      text += `📋 MOTIF DE CONSULTATION\n${summary.motif}\n\n`;
    }

    if (summary.anamnese) {
      text += `🗣️ ANAMNÈSE\n${summary.anamnese}\n\n`;
    }

    if (summary.examen_clinique) {
      text += `🔍 EXAMEN CLINIQUE\n${summary.examen_clinique}\n\n`;
    }

    if (summary.diagnostic) {
      text += `🩺 DIAGNOSTIC\n${summary.diagnostic}\n\n`;
    }

    if (summary.prescription) {
      text += `💊 PRESCRIPTION\n${summary.prescription}\n\n`;
    }

    if (summary.examens_complementaires) {
      text += `🔬 EXAMENS COMPLÉMENTAIRES\n${summary.examens_complementaires}\n\n`;
    }

    if (summary.recommandations) {
      text += `💡 RECOMMANDATIONS\n${summary.recommandations}\n\n`;
    }

    if (summary.suivi) {
      text += `📅 SUIVI\n${summary.suivi}\n\n`;
    }

    text += `\n═══════════════════════════════════\n`;
    text += `Documents partagés: ${sharedDocuments.length}\n`;
    text += `\n🔒 Document médical confidentiel`;

    return text;
  };

  const saveSummary = async () => {
    try {
      await base44.entities.RendezVous.update(rendezVous.id, {
        notes_professionnel: editedSummary,
        statut: 'termine'
      });

      // Envoyer notification au patient
      await base44.entities.Notification.create({
        destinataire_email: rendezVous.created_by,
        type: 'rendez_vous_confirmation',
        titre: 'Résumé de consultation disponible',
        message: 'Votre spécialiste a généré le résumé de votre consultation. Vous pouvez le consulter dans vos rendez-vous.',
        action_page: 'Teleconsultation',
        priorite: 'haute',
        icone: 'FileText'
      });

      if (onSummarySaved) {
        onSummarySaved(editedSummary);
      }

      alert('✅ Résumé enregistré et envoyé au patient');
    } catch (error) {
      console.error('Erreur sauvegarde résumé:', error);
      alert('❌ Erreur lors de la sauvegarde du résumé');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedSummary);
    alert('✅ Résumé copié dans le presse-papiers');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-300 bg-gradient-to-r from-purple-50 to-violet-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Résumé IA de Consultation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {!aiSummary ? (
              <Button
                onClick={generateSummary}
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération du résumé par IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer le résumé automatiquement
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={generateSummary}
                  disabled={generating}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Régénérer
                </Button>
                <Button
                  onClick={() => setEditing(!editing)}
                  variant="outline"
                  className="flex-1"
                >
                  {editing ? 'Aperçu' : 'Modifier'}
                </Button>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Display/Edit */}
      {aiSummary && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Résumé de consultation</CardTitle>
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Généré par IA
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {editedSummary}
                </pre>
              </div>
            )}

            {/* Résumé court en badge */}
            {aiSummary.resume_court && (
              <Alert className="bg-blue-50 border-blue-200">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Résumé en une phrase :</strong> {aiSummary.resume_court}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={saveSummary}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enregistrer et envoyer au patient
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Alert className="bg-purple-50 border-purple-200">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <AlertDescription className="text-purple-800 text-xs">
          <strong>IA Médicale</strong> - Le résumé est généré automatiquement à partir des notes, 
          des échanges et des documents partagés. Vérifiez et modifiez si nécessaire avant l'envoi.
        </AlertDescription>
      </Alert>
    </div>
  );
}