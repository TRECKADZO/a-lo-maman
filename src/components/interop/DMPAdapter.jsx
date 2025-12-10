import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Globe, Share2, CheckCircle, AlertTriangle, Loader2, 
  FileText, Lock, Shield, Upload, ExternalLink 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Adaptateur pour publication vers DMP nationaux/régionaux
 * Compatible IHE XDS.b, IHE PIX/PDQ, et standards SSA
 */
export default function DMPAdapter({ patientEmail, grossesse, enfant }) {
  const [dmpsSelectionnes, setDmpsSelectionnes] = useState([]);
  const [ressourcesSelectionnees, setRessourcesSelectionnees] = useState([]);
  const queryClient = useQueryClient();

  // DMPs disponibles (configurables par pays)
  const dmpsDisponibles = [
    { 
      id: 'ci_dmp', 
      nom: 'DMP Côte d\'Ivoire', 
      pays: 'CI',
      endpoint: 'https://dmp.sante.gouv.ci/api/fhir',
      standard: 'IHE XDS.b',
      statut: 'pilote'
    },
    { 
      id: 'cedeao_dmp', 
      nom: 'CEDEAO Health Data Exchange', 
      pays: 'Regional',
      endpoint: 'https://health-exchange.cedeao.int/fhir',
      standard: 'FHIR R4 + IHE',
      statut: 'actif'
    },
    { 
      id: 'who_afro', 
      nom: 'WHO AFRO Data Hub', 
      pays: 'Regional',
      endpoint: 'https://afro.who.int/health-data/fhir',
      standard: 'FHIR R4',
      statut: 'actif'
    }
  ];

  const { data: consentements = [] } = useQuery({
    queryKey: ['consentements', patientEmail],
    queryFn: () => base44.entities.ConsentementBPPC.filter({ 
      patient_email: patientEmail,
      status: 'active',
      decision: 'permit'
    }),
    enabled: !!patientEmail
  });

  const { data: ressourcesFHIR = [] } = useQuery({
    queryKey: ['ressources_fhir', patientEmail],
    queryFn: () => base44.entities.RessourceFHIR.filter({ 
      patient_email: patientEmail 
    }),
    enabled: !!patientEmail
  });

  const publierVersDMP = useMutation({
    mutationFn: async ({ dmpId, ressources }) => {
      const dmp = dmpsDisponibles.find(d => d.id === dmpId);
      
      // Vérifier consentement pour partage externe
      const consentementPartage = consentements.find(c => 
        c.scope === 'document-sharing' && c.decision === 'permit'
      );

      if (!consentementPartage) {
        throw new Error('Consentement patient requis pour partage DMP');
      }

      // Appel backend pour publication sécurisée
      const response = await base44.functions.invoke('publierDMP', {
        dmp_endpoint: dmp.endpoint,
        dmp_standard: dmp.standard,
        patient_email: patientEmail,
        ressources_ids: ressources,
        consentement_id: consentementPartage.id
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ressources_fhir']);
      toast.success('Données publiées vers DMP');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur publication DMP');
    }
  });

  const toggleDMP = (dmpId) => {
    setDmpsSelectionnes(prev => 
      prev.includes(dmpId) 
        ? prev.filter(id => id !== dmpId)
        : [...prev, dmpId]
    );
  };

  const toggleRessource = (ressourceId) => {
    setRessourcesSelectionnees(prev => 
      prev.includes(ressourceId)
        ? prev.filter(id => id !== ressourceId)
        : [...prev, ressourceId]
    );
  };

  const consentementValide = consentements.some(c => 
    c.scope === 'document-sharing' && c.decision === 'permit'
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Publication vers DMP Nationaux/Régionaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vérification consentement */}
        {!consentementValide && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Consentement requis</p>
                <p className="text-sm text-amber-800">
                  Le patient doit donner son consentement explicite pour le partage de données vers les DMP externes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sélection DMP */}
        <div>
          <Label className="mb-3 block">Plateformes DMP disponibles</Label>
          <div className="space-y-2">
            {dmpsDisponibles.map((dmp) => (
              <div key={dmp.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                <Checkbox
                  id={dmp.id}
                  checked={dmpsSelectionnes.includes(dmp.id)}
                  onCheckedChange={() => toggleDMP(dmp.id)}
                  disabled={!consentementValide}
                />
                <div className="flex-1">
                  <Label htmlFor={dmp.id} className="cursor-pointer font-semibold">
                    {dmp.nom}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{dmp.pays}</Badge>
                    <Badge className="text-xs bg-blue-100 text-blue-800">{dmp.standard}</Badge>
                    <Badge className={`text-xs ${
                      dmp.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {dmp.statut}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{dmp.endpoint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sélection ressources */}
        <div>
          <Label className="mb-3 block">Ressources FHIR à publier</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ressourcesFHIR.map((ressource) => (
              <div key={ressource.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50">
                <Checkbox
                  id={ressource.id}
                  checked={ressourcesSelectionnees.includes(ressource.id)}
                  onCheckedChange={() => toggleRessource(ressource.id)}
                  disabled={!consentementValide || dmpsSelectionnes.length === 0}
                />
                <div className="flex-1">
                  <Label htmlFor={ressource.id} className="cursor-pointer">
                    <Badge className="mr-2">{ressource.resource_type}</Badge>
                    {ressource.resource_json?.title || ressource.resource_type}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {ressource.fhir_id} • {ressource.version} • {ressource.source_system}
                  </p>
                </div>
                <Badge variant={ressource.sync_status === 'synced' ? 'outline' : 'default'} className="text-xs">
                  {ressource.sync_status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{ressourcesFHIR.length}</p>
            <p className="text-xs text-gray-600">Ressources totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {ressourcesFHIR.filter(r => r.sync_status === 'synced').length}
            </p>
            <p className="text-xs text-gray-600">Synchronisées</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {ressourcesFHIR.filter(r => r.sync_status === 'pending').length}
            </p>
            <p className="text-xs text-gray-600">En attente</p>
          </div>
        </div>

        {/* Bouton publication */}
        <Button
          onClick={() => {
            if (dmpsSelectionnes.length === 0) {
              toast.error('Sélectionnez au moins un DMP');
              return;
            }
            if (ressourcesSelectionnees.length === 0) {
              toast.error('Sélectionnez au moins une ressource');
              return;
            }

            dmpsSelectionnes.forEach(dmpId => {
              publierVersDMP.mutate({ dmpId, ressources: ressourcesSelectionnees });
            });
          }}
          disabled={!consentementValide || dmpsSelectionnes.length === 0 || ressourcesSelectionnees.length === 0 || publierVersDMP.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {publierVersDMP.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publication en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Publier vers {dmpsSelectionnes.length} DMP
            </>
          )}
        </Button>

        {/* Conformité */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-xs text-green-900">
              <strong>Conformité POPIA/NDPR :</strong> Toutes les publications respectent les consentements 
              patients et sont chiffrées en transit (TLS 1.3) et au repos (AES-256).
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}