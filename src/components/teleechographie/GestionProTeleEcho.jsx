import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, FileText, Upload, Save, 
  CheckCircle, Image as ImageIcon, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function GestionProTeleEcho({ professionnel }) {
  const queryClient = useQueryClient();
  const [selectedRDV, setSelectedRDV] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [rapportData, setRapportData] = useState({
    age_gestationnel_calcule: '',
    biometrie: { BIP: '', LF: '', PC: '', PA: '', EPF: '' },
    conclusion: '',
    recommendations: '',
    images_urls: [],
    anomalies_detectees: []
  });

  const { data: rdvs = [], isLoading } = useQuery({
    queryKey: ['rdv_teleecho_pro', professionnel?.id],
    queryFn: async () => {
      if (!professionnel) return [];
      return await base44.entities.RDVTeleEchographie.filter(
        { gynecologue_id: professionnel.id },
        '-date_rdv'
      );
    },
    enabled: !!professionnel,
  });

  const { data: centres = [] } = useQuery({
    queryKey: ['centres_teleecho'],
    queryFn: () => base44.entities.CentreTeleEchographie.filter({ actif: true }),
  });

  const rdvATraiter = rdvs.filter(r => r.statut === 'termine' && !r.rapport_echographie?.valide_par_gynecologue);
  const rdvValides = rdvs.filter(r => r.rapport_echographie?.valide_par_gynecologue);

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setRapportData(prev => ({
        ...prev,
        images_urls: [...prev.images_urls, file_url]
      }));
      toast.success('Image ajoutée');
    } catch (error) {
      toast.error('Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const validerRapport = useMutation({
    mutationFn: async () => {
      if (!selectedRDV) return;

      await base44.entities.RDVTeleEchographie.update(selectedRDV.id, {
        rapport_echographie: {
          ...rapportData,
          redige_par: professionnel.nom_complet,
          valide_par_gynecologue: true,
          date_rapport: new Date().toISOString()
        },
        statut: 'termine'
      });

      // Notifier la maman
      await base44.entities.Notification.create({
        destinataire_email: selectedRDV.maman_email,
        type: 'systeme',
        titre: '📄 Votre rapport d\'échographie est disponible',
        message: `Le Dr. ${professionnel.nom_complet} a validé votre rapport d'échographie. Consultez-le maintenant.`,
        action_page: 'TeleEchographie',
        priorite: 'haute',
        icone: 'FileText'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_teleecho_pro']);
      toast.success('Rapport validé et envoyé à la patiente');
      setSelectedRDV(null);
      setRapportData({
        age_gestationnel_calcule: '',
        biometrie: { BIP: '', LF: '', PC: '', PA: '', EPF: '' },
        conclusion: '',
        recommendations: '',
        images_urls: [],
        anomalies_detectees: []
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-teal-600">{rdvATraiter.length}</p>
            <p className="text-xs text-gray-600">À valider</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{rdvValides.length}</p>
            <p className="text-xs text-gray-600">Validés</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{rdvs.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste RDV à traiter */}
      {selectedRDV ? (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rédaction du rapport</span>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedRDV(null)}
              >
                Annuler
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload images */}
            <div>
              <Label>Images échographiques</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Ajouter une image</span>
                    </>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {rapportData.images_urls.map((url, idx) => (
                    <img key={idx} src={url} className="w-full aspect-square object-cover rounded" />
                  ))}
                </div>
              </div>
            </div>

            {/* Biométrie */}
            <div>
              <Label>Biométrie fœtale (mm)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  placeholder="BIP"
                  value={rapportData.biometrie.BIP}
                  onChange={(e) => setRapportData(prev => ({
                    ...prev,
                    biometrie: { ...prev.biometrie, BIP: parseFloat(e.target.value) || '' }
                  }))}
                />
                <Input
                  placeholder="LF"
                  value={rapportData.biometrie.LF}
                  onChange={(e) => setRapportData(prev => ({
                    ...prev,
                    biometrie: { ...prev.biometrie, LF: parseFloat(e.target.value) || '' }
                  }))}
                />
                <Input
                  placeholder="PC"
                  value={rapportData.biometrie.PC}
                  onChange={(e) => setRapportData(prev => ({
                    ...prev,
                    biometrie: { ...prev.biometrie, PC: parseFloat(e.target.value) || '' }
                  }))}
                />
                <Input
                  placeholder="PA"
                  value={rapportData.biometrie.PA}
                  onChange={(e) => setRapportData(prev => ({
                    ...prev,
                    biometrie: { ...prev.biometrie, PA: parseFloat(e.target.value) || '' }
                  }))}
                />
                <Input
                  placeholder="EPF (g)"
                  value={rapportData.biometrie.EPF}
                  onChange={(e) => setRapportData(prev => ({
                    ...prev,
                    biometrie: { ...prev.biometrie, EPF: parseFloat(e.target.value) || '' }
                  }))}
                  className="col-span-2"
                />
              </div>
            </div>

            {/* Âge gestationnel */}
            <div>
              <Label>Âge gestationnel calculé</Label>
              <Input
                placeholder="Ex: 12 SA + 3 jours"
                value={rapportData.age_gestationnel_calcule}
                onChange={(e) => setRapportData(prev => ({ ...prev, age_gestationnel_calcule: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Conclusion */}
            <div>
              <Label>Conclusion</Label>
              <Textarea
                placeholder="Grossesse évolutive, biométrie conforme..."
                value={rapportData.conclusion}
                onChange={(e) => setRapportData(prev => ({ ...prev, conclusion: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Recommandations */}
            <div>
              <Label>Recommandations</Label>
              <Textarea
                placeholder="Contrôle échographique à prévoir à..."
                value={rapportData.recommendations}
                onChange={(e) => setRapportData(prev => ({ ...prev, recommendations: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>

            <Button
              onClick={() => validerRapport.mutate()}
              disabled={validerRapport.isPending || !rapportData.conclusion}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-600"
            >
              {validerRapport.isPending ? (
                'Validation...'
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Valider et envoyer le rapport
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Rapports à valider ({rdvATraiter.length})</h3>
          {rdvATraiter.map(rdv => {
            const centre = centres.find(c => c.id === rdv.centre_id);
            return (
              <Card key={rdv.id} className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{rdv.type_echographie}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(rdv.date_rdv), 'd MMM yyyy', { locale: fr })} - SA {rdv.semaine_grossesse}
                      </p>
                      <p className="text-xs text-gray-500">{centre?.nom_centre}</p>
                    </div>
                    <Button onClick={() => setSelectedRDV(rdv)}>
                      Rédiger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {rdvATraiter.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-600">
                Aucun rapport en attente
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}