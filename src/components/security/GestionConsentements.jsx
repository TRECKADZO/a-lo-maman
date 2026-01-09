import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  Eye,
  RotateCcw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPES_DONNEES = {
  donnees_medicales: {
    label: 'Données médicales',
    description: 'Dossiers médicaux, diagnostics, traitements',
    icon: '🏥',
    critical: true
  },
  donnees_personnelles: {
    label: 'Données personnelles',
    description: 'Nom, prénom, contact, adresse',
    icon: '👤',
    critical: true
  },
  donnees_enfants: {
    label: 'Données des enfants',
    description: 'Carnets de santé, vaccins, développement',
    icon: '👶',
    critical: true
  },
  donnees_grossesse: {
    label: 'Suivi de grossesse',
    description: 'Consultations, échographies, suivi fœtal',
    icon: '🤰',
    critical: true
  },
  partage_professionnel: {
    label: 'Partage avec professionnels',
    description: 'Autorisation de partager avec médecins/sages-femmes',
    icon: '👨‍⚕️',
    critical: false
  },
  partage_famille: {
    label: 'Partage en famille',
    description: 'Autorisation de partager avec proches',
    icon: '👨‍👩‍👧‍👦',
    critical: false
  },
  analytics: {
    label: 'Statistiques anonymes',
    description: 'Utilisation de données anonymes pour améliorer le service',
    icon: '📊',
    critical: false
  },
  recherche_medicale: {
    label: 'Recherche médicale',
    description: 'Participation à des études de santé (anonymisé)',
    icon: '🔬',
    critical: false
  },
  marketing: {
    label: 'Communications marketing',
    description: 'Recevoir des actualités et offres de la plateforme',
    icon: '📧',
    critical: false
  },
  donnees_vitales: {
    label: 'Données vitales',
    description: 'Tension, poids, sommeil et autres mesures',
    icon: '❤️',
    critical: false
  }
};

export default function GestionConsentements({ user }) {
  const [showRevoquerDialog, setShowRevoquerDialog] = useState(null);
  const [raison, setRaison] = useState('');
  const queryClient = useQueryClient();

  const { data: consentements = [], isLoading } = useQuery({
    queryKey: ['consentements', user?.email],
    queryFn: async () => {
      return await base44.entities.ConsentementGDPR.filter({
        user_email: user.email
      });
    },
    enabled: !!user,
  });

  const consentementMutation = useMutation({
    mutationFn: async ({ action, type_donnee, raison_revocation }) => {
      return await base44.asServiceRole.functions.invoke('gererConsentementGDPR', {
        action,
        type_donnee,
        statut: action === 'accepter' ? 'accepte' : action === 'refuser' ? 'refuse' : 'revoque',
        raison_revocation
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['consentements'] });
      setShowRevoquerDialog(null);
      setRaison('');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du consentement');
    }
  });

  const handleAccepter = (type_donnee) => {
    consentementMutation.mutate({ action: 'accepter', type_donnee });
  };

  const handleRefuser = (type_donnee) => {
    consentementMutation.mutate({ action: 'refuser', type_donnee });
  };

  const handleRevoquer = (type_donnee) => {
    if (!raison.trim()) {
      toast.error('Veuillez indiquer la raison de la révocation');
      return;
    }
    consentementMutation.mutate({ 
      action: 'revoquer', 
      type_donnee,
      raison_revocation: raison 
    });
  };

  const getConsentement = (type_donnee) => {
    return consentements.find(c => c.type_donnee === type_donnee);
  };

  const getStatutBadge = (statut) => {
    const styles = {
      accepte: 'bg-green-100 text-green-800',
      refuse: 'bg-red-100 text-red-800',
      revoque: 'bg-orange-100 text-orange-800'
    };
    
    const labels = {
      accepte: '✓ Accepté',
      refuse: '✗ Refusé',
      revoque: '↻ Révoqué'
    };

    return (
      <Badge className={styles[statut]}>
        {labels[statut]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const consentementsCritiques = Object.entries(TYPES_DONNEES)
    .filter(([_, config]) => config.critical)
    .map(([key, _]) => key);

  const consentementsCritiquesAcceptes = consentementsCritiques.filter(type => {
    const consent = getConsentement(type);
    return consent?.statut === 'accepte';
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Gestion des consentements RGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Vous contrôlez totalement l'utilisation de vos données. Vous pouvez accepter, refuser ou révoquer 
              vos consentements à tout moment. Ces modifications seront enregistrées dans votre historique.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">📋 Statut général</p>
            <p className="text-xs text-blue-800">
              {consentementsCritiquesAcceptes.length} / {consentementsCritiques.length} consentements critiques acceptés
            </p>
            <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(consentementsCritiquesAcceptes.length / consentementsCritiques.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consentements par catégorie */}
      <div className="space-y-4">
        {/* Données critiques */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Données essentielles
          </h3>
          <div className="grid gap-3">
            {Object.entries(TYPES_DONNEES)
              .filter(([_, config]) => config.critical)
              .map(([type, config]) => {
                const consent = getConsentement(type);
                return (
                  <ConsentementCard
                    key={type}
                    type={type}
                    config={config}
                    consent={consent}
                    onAccepter={() => handleAccepter(type)}
                    onRefuser={() => handleRefuser(type)}
                    onRevoquer={() => setShowRevoquerDialog(type)}
                    isLoading={consentementMutation.isPending}
                  />
                );
              })}
          </div>
        </div>

        {/* Données optionnelles */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            Préférences optionnelles
          </h3>
          <div className="grid gap-3">
            {Object.entries(TYPES_DONNEES)
              .filter(([_, config]) => !config.critical)
              .map(([type, config]) => {
                const consent = getConsentement(type);
                return (
                  <ConsentementCard
                    key={type}
                    type={type}
                    config={config}
                    consent={consent}
                    onAccepter={() => handleAccepter(type)}
                    onRefuser={() => handleRefuser(type)}
                    onRevoquer={() => setShowRevoquerDialog(type)}
                    isLoading={consentementMutation.isPending}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Historique */}
      {consentements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique récent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {consentements
                .sort((a, b) => new Date(b.date_consentement) - new Date(a.date_consentement))
                .slice(0, 5)
                .map((c) => (
                  <div key={c.id} className="text-xs text-gray-600 p-2 border-l-2 border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {TYPES_DONNEES[c.type_donnee]?.label}
                      </span>
                      {getStatutBadge(c.statut)}
                    </div>
                    <p className="text-gray-500 mt-1">
                      {format(new Date(c.date_consentement), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog révocation */}
      <Dialog open={!!showRevoquerDialog} onOpenChange={() => setShowRevoquerDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer le consentement</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de révoquer votre consentement pour {TYPES_DONNEES[showRevoquerDialog]?.label}.
              Veuillez indiquer la raison.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Pourquoi révoquez-vous ce consentement ?"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRevoquerDialog(null);
                  setRaison('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRevoquer(showRevoquerDialog)}
                disabled={consentementMutation.isPending || !raison.trim()}
                className="flex-1"
              >
                {consentementMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Révocation...
                  </>
                ) : (
                  'Révoquer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsentementCard({ type, config, consent, onAccepter, onRefuser, onRevoquer, isLoading }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{config.icon}</span>
              <h4 className="font-semibold">{config.label}</h4>
              {config.critical && (
                <Badge variant="outline" className="text-xs">Obligatoire</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{config.description}</p>
            {consent && (
              <p className="text-xs text-gray-500 mt-2">
                {consent.statut === 'accepte' && `Accepté le ${format(new Date(consent.date_consentement), 'dd MMM yyyy', { locale: fr })}`}
                {consent.statut === 'refuse' && `Refusé le ${format(new Date(consent.date_consentement), 'dd MMM yyyy', { locale: fr })}`}
                {consent.statut === 'revoque' && `Révoqué le ${format(new Date(consent.revoque_le), 'dd MMM yyyy', { locale: fr })}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {consent && (
              <>
                {getStatutBadge(consent.statut)}
                {consent.statut === 'accepte' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRevoquer}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Révoquer
                  </Button>
                )}
              </>
            )}

            {!consent && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={onAccepter}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefuser}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Refuser
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}