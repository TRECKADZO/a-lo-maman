import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  Info,
  CheckCircle,
  Globe,
  Smartphone
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

/**
 * Composant pour les paramètres de synchronisation calendrier
 * Permet aux utilisateurs (mamans et pros) d'exporter leurs rendez-vous
 */
export default function CalendarSyncSettings() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rendezVous = [] } = useQuery({
    queryKey: ['rdv_user', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.RendezVous.filter(
        { created_by: user.email },
        '-date_rdv'
      );
    },
    enabled: !!user
  });

  const rdvFuturs = rendezVous.filter(rdv => 
    new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule'
  );

  // Générer fichier iCal
  const generateICalFile = () => {
    setIsGenerating(true);

    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//A'lo Maman//Rendez-vous//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Rendez-vous - A'lo Maman
X-WR-TIMEZONE:Africa/Abidjan

`;

    rdvFuturs.forEach(rdv => {
      const startDate = new Date(rdv.date_rdv);
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icalContent += `BEGIN:VEVENT
UID:${rdv.id}@alomaman.ci
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Consultation - ${rdv.motif || 'Rendez-vous'}
DESCRIPTION:Type: ${rdv.type_consultation}\\nMotif: ${rdv.motif || 'Consultation'}
LOCATION:${rdv.adresse_consultation || 'Téléconsultation'}
STATUS:${rdv.statut === 'confirme' ? 'CONFIRMED' : 'TENTATIVE'}
BEGIN:VALARM
TRIGGER:-PT60M
DESCRIPTION:Rappel de rendez-vous
ACTION:DISPLAY
END:VALARM
END:VEVENT

`;
    });

    icalContent += 'END:VCALENDAR';

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendez-vous-alomaman-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setTimeout(() => setIsGenerating(false), 1000);
  };

  // Export vers Google Calendar
  const exportToGoogleCalendar = () => {
    if (rdvFuturs.length === 0) {
      alert('Aucun rendez-vous futur à exporter');
      return;
    }

    const rdv = rdvFuturs[0];
    const startDate = format(new Date(rdv.date_rdv), "yyyyMMdd'T'HHmmss");
    const endDate = format(new Date(new Date(rdv.date_rdv).getTime() + 30 * 60000), "yyyyMMdd'T'HHmmss");
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultation A\'lo Maman')}&dates=${startDate}/${endDate}&details=${encodeURIComponent(rdv.motif || 'Consultation')}&location=${encodeURIComponent(rdv.adresse_consultation || 'Téléconsultation')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <Card className="shadow-lg border-none mt-6">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">Synchronisation Calendrier</p>
            <p className="text-sm text-gray-600 font-normal">
              Exportez vos rendez-vous vers vos calendriers préférés
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Info rendez-vous */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Rendez-vous futurs</p>
            <p className="text-3xl font-bold text-blue-600">{rdvFuturs.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Total rendez-vous</p>
            <p className="text-3xl font-bold text-purple-600">{rendezVous.length}</p>
          </div>
        </div>

        {rdvFuturs.length > 0 ? (
          <>
            {/* Export Options */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Exporter vers
              </h3>

              {/* Fichier iCal */}
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Fichier iCalendar (.ics)</p>
                      <p className="text-sm text-gray-600">Compatible avec tous les calendriers</p>
                    </div>
                  </div>
                  <Button 
                    onClick={generateICalFile} 
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Google Calendar */}
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Google Calendar</p>
                      <p className="text-sm text-gray-600">Ajouter directement à Google Calendar</p>
                    </div>
                  </div>
                  <Button 
                    onClick={exportToGoogleCalendar} 
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir
                  </Button>
                </div>
              </div>

              {/* Outlook */}
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Outlook / Office 365</p>
                      <p className="text-sm text-gray-600">Importez le fichier .ics téléchargé</p>
                    </div>
                  </div>
                  <Badge variant="outline">Manuel</Badge>
                </div>
              </div>

              {/* Apple Calendar */}
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Apple Calendar (iOS/Mac)</p>
                      <p className="text-sm text-gray-600">Ouvrez le fichier .ics sur votre appareil</p>
                    </div>
                  </div>
                  <Badge variant="outline">Manuel</Badge>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Comment utiliser :</strong> Téléchargez le fichier .ics et ouvrez-le avec votre application calendrier préférée. Tous vos rendez-vous futurs seront automatiquement importés.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Vous n'avez pas de rendez-vous futurs à exporter. Prenez rendez-vous avec un professionnel pour utiliser cette fonctionnalité.
            </AlertDescription>
          </Alert>
        )}

        {/* Avantages */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Avantages de la synchronisation
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Ne manquez plus jamais un rendez-vous médical</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Visualisez tous vos rendez-vous dans votre calendrier habituel</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Recevez des rappels automatiques sur tous vos appareils</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Partagez facilement vos disponibilités avec votre famille</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}