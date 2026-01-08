import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Baby,
  FileText,
  Calendar,
  Download,
  Mail,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';

export default function ConfirmationDeclaration({ declarationId, onCreateCarnet }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: declaration } = useQuery({
    queryKey: ['declaration', declarationId],
    queryFn: () => base44.entities.DeclarationNaissance.filter({ id: declarationId }),
    select: (data) => data[0],
    enabled: !!declarationId,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    // Confetti celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const creerCarnetEnfant = useMutation({
    mutationFn: async () => {
      if (!declaration) return;

      // Créer le profil enfant
      const enfant = await base44.entities.EnfantCarnet.create({
        prenoms: declaration.prenoms_enfant,
        nom_famille: declaration.nom_famille,
        sexe: declaration.sexe,
        date_naissance: declaration.date_naissance,
        lieu_naissance: declaration.lieu_naissance,
        ville_naissance: declaration.ville,
        no_acte_naissance: declaration.no_acte_naissance || '',
        groupe_sanguin: '',
        allergies: [],
        mesures: [],
        vaccins: [],
        consultations: [],
        jalons: [],
      });

      // Ajouter les premiers rappels vaccins
      const vaccinsInitiaux = [
        {
          nom: "BCG",
          date_prevue: declaration.date_naissance,
          description: "Vaccin contre la tuberculose (à la naissance)"
        },
        {
          nom: "Polio 0",
          date_prevue: declaration.date_naissance,
          description: "Première dose de Polio (à la naissance)"
        },
        {
          nom: "Hépatite B",
          date_prevue: declaration.date_naissance,
          description: "Première dose d'Hépatite B (à la naissance)"
        }
      ];

      for (const vaccin of vaccinsInitiaux) {
        await base44.entities.RappelSante.create({
          type_rappel: 'vaccin',
          titre: `Vaccin ${vaccin.nom} pour ${declaration.prenoms_enfant}`,
          description: vaccin.description,
          date_rappel: vaccin.date_prevue,
          enfant_id: enfant.id,
          statut: 'en_attente'
        }).catch(() => {});
      }

      // Mettre à jour la déclaration avec l'ID enfant
      await base44.entities.DeclarationNaissance.update(declarationId, {
        enfant_id: enfant.id,
        statut: 'complete'
      });

      // Notification
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'systeme',
        titre: '🎉 Carnet médical créé !',
        message: `Le carnet médical de ${declaration.prenoms_enfant} a été créé avec succès`,
        action_page: 'Enfants',
        action_params: { enfantId: enfant.id },
        priorite: 'haute',
        icone: 'Baby'
      }).catch(() => {});

      return enfant;
    },
    onSuccess: (enfant) => {
      queryClient.invalidateQueries(['enfants']);
      toast.success('Carnet médical créé avec succès !');
      navigate(createPageUrl('Enfants'));
      if (onCreateCarnet) onCreateCarnet();
    },
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!declaration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pb-24">
      <div className="max-w-2xl mx-auto p-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Félicitations ! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            La déclaration de naissance de <span className="font-semibold text-pink-600">{declaration.prenoms_enfant}</span> a été enregistrée
          </p>
        </div>

        {/* Numéro de suivi */}
        <Card className="mb-6 shadow-lg border-2 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Numéro de suivi</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Enregistrée</Badge>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <code className="text-lg font-mono font-bold text-gray-900">
                {declaration.numero_suivi}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(declaration.numero_suivi)}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Conservez ce numéro pour suivre votre dossier
            </p>
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Prénom(s)</span>
                <span className="font-semibold">{declaration.prenoms_enfant}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Nom</span>
                <span className="font-semibold">{declaration.nom_famille}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Sexe</span>
                <Badge variant="outline">
                  {declaration.sexe === 'garcon' ? 'Garçon' : 'Fille'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Date de naissance</span>
                <span className="font-semibold">
                  {format(new Date(declaration.date_naissance), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Lieu</span>
                <span className="font-semibold text-right">{declaration.lieu_naissance}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prochaines étapes */}
        <Card className="mb-6 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Prochaines étapes
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Réception de l'email de confirmation</p>
                  <p className="text-xs text-gray-600">Dans les prochaines minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Traitement par l'état civil</p>
                  <p className="text-xs text-gray-600">5 à 10 jours ouvrables</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Réception de l'acte de naissance</p>
                  <p className="text-xs text-gray-600">Notification dès disponibilité</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Carnet Médical */}
        <Card className="mb-6 shadow-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-white to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Créez le carnet médical</h3>
                <p className="text-sm text-gray-600">Suivez la santé de {declaration.prenoms_enfant}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Suivi de croissance et vaccins</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>Rappels automatiques de vaccinations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText className="w-4 h-4 text-pink-500" />
                <span>Historique médical centralisé</span>
              </div>
            </div>

            <Button
              onClick={() => creerCarnetEnfant.mutate()}
              disabled={creerCarnetEnfant.isPending}
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-600 text-lg"
            >
              {creerCarnetEnfant.isPending ? (
                'Création en cours...'
              ) : (
                <>
                  Créer le carnet médical
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="w-full mt-2"
            >
              Plus tard
            </Button>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (declaration.pdf_declaration_url) {
                window.open(declaration.pdf_declaration_url, '_blank');
              } else {
                toast.info('PDF en cours de génération');
              }
            }}
            className="h-20 flex-col gap-2"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Télécharger PDF</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('Support'))}
            className="h-20 flex-col gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Besoin d'aide ?</span>
          </Button>
        </div>
      </div>
    </div>
  );
}