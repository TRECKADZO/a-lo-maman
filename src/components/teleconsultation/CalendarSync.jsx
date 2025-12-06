import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  ExternalLink,
  Globe,
  Smartphone,
  X
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Synchronisation avec calendriers externes (Google Calendar, Outlook, Apple Calendar)
 * Export iCal, liens de souscription, import/export
 */
export default function CalendarSync({ professionnel, onClose }) {
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    auto_sync: false,
    sync_interval: '15', // minutes
    include_patient_names: false, // RGPD
    default_event_duration: '30', // minutes
    reminder_before: '60' // minutes
  });

  const { data: rendezVous = [] } = useQuery({
    queryKey: ['rdv_export', professionnel?.id],
    queryFn: async () => {
      if (!professionnel) return [];
      return base44.entities.RendezVous.filter(
        { professionnel_id: professionnel.id },
        '-date_rdv'
      );
    },
    enabled: !!professionnel
  });

  // Générer fichier iCal
  const generateICalFile = () => {
    const rdvFuturs = rendezVous.filter(rdv => 
      new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule'
    );

    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//A'lo Maman//Rendez-vous//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Rendez-vous - A'lo Maman
X-WR-TIMEZONE:Africa/Abidjan
X-WR-CALDESC:Calendrier des rendez-vous professionnels

`;

    rdvFuturs.forEach(rdv => {
      const startDate = new Date(rdv.date_rdv);
      const endDate = new Date(startDate.getTime() + 30 * 60000); // +30 min par défaut
      
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const title = syncSettings.include_patient_names 
        ? `Consultation - ${rdv.motif || 'Patient'}`
        : `Consultation - ${rdv.type_consultation}`;

      icalContent += `BEGIN:VEVENT
UID:${rdv.id}@alomaman.ci
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:Type: ${rdv.type_consultation}\\nMotif: ${rdv.motif || 'Consultation'}
LOCATION:${rdv.adresse_consultation || 'Téléconsultation'}
STATUS:${rdv.statut === 'confirme' ? 'CONFIRMED' : 'TENTATIVE'}
BEGIN:VALARM
TRIGGER:-PT${syncSettings.reminder_before}M
DESCRIPTION:Rappel de rendez-vous
ACTION:DISPLAY
END:VALARM
END:VEVENT

`;
    });

    icalContent += 'END:VCALENDAR';

    return icalContent;
  };

  const downloadICalFile = () => {
    const icalContent = generateICalFile();
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendez-vous-alomaman-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Générer lien de souscription (webcal)
  const generateSubscriptionLink = () => {
    // En production, ce serait un lien vers une API qui génère le iCal dynamiquement
    const baseUrl = window.location.origin;
    return `webcal://${baseUrl}/api/calendar/${professionnel.id}/subscribe.ics`;
  };

  const copySubscriptionLink = () => {
    const link = generateSubscriptionLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export vers Google Calendar
  const exportToGoogleCalendar = () => {
    const rdv = rendezVous.find(r => new Date(r.date_rdv) > new Date() && r.statut !== 'annule');
    if (!rdv) {
      alert('Aucun rendez-vous futur à exporter');
      return;
    }

    const startDate = format(new Date(rdv.date_rdv), "yyyyMMdd'T'HHmmss");
    const endDate = format(new Date(new Date(rdv.date_rdv).getTime() + 30 * 60000), "yyyyMMdd'T'HHmmss");
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultation A\'lo Maman')}&dates=${startDate}/${endDate}&details=${encodeURIComponent(rdv.motif || 'Consultation')}&location=${encodeURIComponent(rdv.adresse_consultation || 'Téléconsultation')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Synchronisation Calendrier
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Exportez et synchronisez vos rendez-vous avec vos calendriers préférés
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <Tabs defaultValue="export">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="export">
                <Download className="w-4 h-4 mr-2" />
                Export
              </TabsTrigger>
              <TabsTrigger value="subscribe">
                <RefreshCw className="w-4 h-4 mr-2" />
                Souscription
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Globe className="w-4 h-4 mr-2" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            {/* Export manuel */}
            <TabsContent value="export" className="space-y-4 mt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Export ponctuel :</strong> Téléchargez un fichier .ics contenant tous vos rendez-vous futurs. Compatible avec tous les calendriers.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Fichier iCalendar (.ics)</p>
                      <p className="text-sm text-gray-600">
                        {rendezVous.filter(r => new Date(r.date_rdv) > new Date() && r.statut !== 'annule').length} rendez-vous futurs
                      </p>
                    </div>
                    <Button onClick={downloadICalFile} className="bg-blue-600 hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger .ics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Importer dans vos applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Google Calendar */}
                  <div className="p-4 bg-white border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Google Calendar</p>
                        <p className="text-xs text-gray-600">Ajouter à votre Google Calendar</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={exportToGoogleCalendar} variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ouvrir
                    </Button>
                  </div>

                  {/* Outlook */}
                  <div className="p-4 bg-white border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Outlook / Office 365</p>
                        <p className="text-xs text-gray-600">Importez le fichier .ics téléchargé</p>
                      </div>
                    </div>
                    <Badge variant="outline">Manuel</Badge>
                  </div>

                  {/* Apple Calendar */}
                  <div className="p-4 bg-white border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Apple Calendar (iOS/Mac)</p>
                        <p className="text-xs text-gray-600">Ouvrez le fichier .ics sur votre appareil</p>
                      </div>
                    </div>
                    <Badge variant="outline">Manuel</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Souscription automatique */}
            <TabsContent value="subscribe" className="space-y-4 mt-6">
              <Alert className="bg-purple-50 border-purple-200">
                <RefreshCw className="w-4 h-4 text-purple-600" />
                <AlertDescription className="text-purple-900">
                  <strong>Synchronisation automatique :</strong> Abonnez votre calendrier pour recevoir automatiquement les mises à jour de vos rendez-vous.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Lien de souscription webcal://
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={generateSubscriptionLink()}
                        readOnly
                        className="font-mono text-sm bg-gray-50"
                      />
                      <Button
                        onClick={copySubscriptionLink}
                        variant="outline"
                      >
                        {copiedLink ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Copiez ce lien et ajoutez-le dans les paramètres de votre application calendrier
                    </p>
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-900 text-sm">
                      <strong>Note :</strong> La souscription automatique nécessite une configuration serveur. Pour l'instant, utilisez l'export manuel.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comment s'abonner ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Google Calendar
                    </p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Ouvrez Google Calendar</li>
                      <li>Cliquez sur "+" à côté de "Autres agendas"</li>
                      <li>Sélectionnez "À partir de l'URL"</li>
                      <li>Collez le lien webcal:// ci-dessus</li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-700" />
                      Apple Calendar (iPhone/Mac)
                    </p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Ouvrez Réglages → Calendrier → Comptes</li>
                      <li>Touchez "Ajouter un compte" → "Autre"</li>
                      <li>Sélectionnez "Ajouter un calendrier avec abonnement"</li>
                      <li>Collez le lien webcal://</li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-700" />
                      Outlook
                    </p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Ouvrez Outlook → Calendrier</li>
                      <li>Clic droit sur "Mes calendriers" → "Ajouter un calendrier"</li>
                      <li>Choisissez "À partir d'Internet"</li>
                      <li>Collez le lien webcal://</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Paramètres */}
            <TabsContent value="settings" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paramètres d'export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée par défaut des événements (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={syncSettings.default_event_duration}
                      onChange={(e) => setSyncSettings({...syncSettings, default_event_duration: e.target.value})}
                      min="15"
                      max="120"
                      step="15"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder">Rappel avant l'événement (minutes)</Label>
                    <Input
                      id="reminder"
                      type="number"
                      value={syncSettings.reminder_before}
                      onChange={(e) => setSyncSettings({...syncSettings, reminder_before: e.target.value})}
                      min="0"
                      max="1440"
                      step="15"
                    />
                  </div>

                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      <strong>RGPD :</strong> Par défaut, les noms des patients ne sont pas inclus dans les exports pour protéger leur vie privée.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">RDV futurs</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {rendezVous.filter(r => new Date(r.date_rdv) > new Date() && r.statut !== 'annule').length}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">RDV cette semaine</p>
                      <p className="text-2xl font-bold text-green-600">
                        {rendezVous.filter(r => {
                          const rdvDate = new Date(r.date_rdv);
                          const weekStart = new Date();
                          const weekEnd = new Date();
                          weekEnd.setDate(weekEnd.getDate() + 7);
                          return rdvDate >= weekStart && rdvDate <= weekEnd && r.statut !== 'annule';
                        }).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info footer */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              <strong>💡 Astuce :</strong> La synchronisation automatique permet de toujours avoir vos rendez-vous à jour dans votre calendrier principal. Les modifications sont reflétées en temps réel.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}