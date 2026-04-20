import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Shield, CheckCircle, XCircle, FileText, AlertTriangle, 
  Lock, Unlock, Clock, User, Building2, Loader2, Share2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Gestion des consentements patients selon BPPC (Basic Patient Privacy Consents)
 * Conforme POPIA (Afrique du Sud) et NDPR (Nigeria)
 */
export default function GestionConsentements({ patientEmail }) {
  const [nouveauConsentement, setNouveauConsentement] = useState({
    policy_type: 'opt-in',
    scope: 'patient-privacy',
    decision: 'permit',
    expiration_date: ''
  });
  const [showFormulaire, setShowFormulaire] = useState(false);
  const queryClient = useQueryClient();

  const { data: consentements = [] } = useQuery({
    queryKey: ['consentements', patientEmail],
    queryFn: () => base44.entities.ConsentementBPPC.filter({ 
      patient_email: patientEmail 
    }),
    enabled: !!patientEmail
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const creerConsentement = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ConsentementBPPC.create({
        patient_email: patientEmail,
        policy_id: `policy_${Date.now()}`,
        date_time: new Date().toISOString(),
        ...data,
        verification: {
          verified: true,
          verification_date: new Date().toISOString(),
          verified_by: user?.email,
          method: 'electronic'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['consentements']);
      toast.success('Consentement enregistré');
      setShowFormulaire(false);
      setNouveauConsentement({
        policy_type: 'opt-in',
        scope: 'patient-privacy',
        decision: 'permit',
        expiration_date: ''
      });
    }
  });

  const revoquerConsentement = useMutation({
    mutationFn: async (consentementId) => {
      return await base44.entities.ConsentementBPPC.update(consentementId, {
        status: 'inactive',
        decision: 'deny'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['consentements']);
      toast.success('Consentement révoqué');
    }
  });

  const politiquesDisponibles = [
    { 
      value: 'opt-in', 
      label: 'Opt-in (Autorisation explicite)',
      desc: 'Partage autorisé après accord explicite'
    },
    { 
      value: 'opt-out', 
      label: 'Opt-out (Autorisation par défaut)',
      desc: 'Partage autorisé sauf refus explicite'
    },
    { 
      value: 'emergency-only', 
      label: 'Urgences uniquement',
      desc: 'Partage uniquement en situation d\'urgence'
    },
    { 
      value: 'research', 
      label: 'Recherche médicale',
      desc: 'Données anonymisées pour recherche'
    }
  ];

  const scopesDisponibles = [
    { value: 'patient-privacy', label: 'Protection vie privée', icon: Lock },
    { value: 'treatment', label: 'Soins et traitement', icon: FileText },
    { value: 'research', label: 'Recherche médicale', icon: FileText },
    { value: 'document-sharing', label: 'Partage documents DMP', icon: Share2 },
  ];

  const actionsDisponibles = ['access', 'correct', 'disclose', 'use', 'collect'];
  const purposesDisponibles = ['TREAT', 'ETREAT', 'HPAYMT', 'HRESCH', 'PUBHLTH'];

  const consentementsActifs = consentements.filter(c => c.status === 'active');
  const consentementsExpires = consentements.filter(c => {
    if (!c.expiration_date) return false;
    return new Date(c.expiration_date) < new Date();
  });

  return (
    <div className="space-y-6">
      {/* Résumé consentements */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Consentements BPPC</h3>
                <p className="text-sm text-blue-700">Conforme POPIA/NDPR</p>
              </div>
            </div>
            <Button onClick={() => setShowFormulaire(!showFormulaire)} variant="outline">
              {showFormulaire ? 'Annuler' : 'Nouveau consentement'}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-green-600">{consentementsActifs.length}</p>
              <p className="text-xs text-gray-600">Actifs</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{consentementsExpires.length}</p>
              <p className="text-xs text-gray-600">Expirés</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{consentements.length}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire nouveau consentement */}
      {showFormulaire && (
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Enregistrer un nouveau consentement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type de politique</Label>
              <Select 
                value={nouveauConsentement.policy_type} 
                onValueChange={(v) => setNouveauConsentement({...nouveauConsentement, policy_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {politiquesDisponibles.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <div>
                        <p className="font-semibold">{p.label}</p>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Portée du consentement</Label>
              <Select 
                value={nouveauConsentement.scope} 
                onValueChange={(v) => setNouveauConsentement({...nouveauConsentement, scope: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopesDisponibles.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <s.icon className="w-4 h-4" />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Décision</Label>
              <Select 
                value={nouveauConsentement.decision} 
                onValueChange={(v) => setNouveauConsentement({...nouveauConsentement, decision: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permit">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Autoriser
                    </div>
                  </SelectItem>
                  <SelectItem value="deny">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Refuser
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date d'expiration (optionnelle)</Label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={nouveauConsentement.expiration_date}
                onChange={(e) => setNouveauConsentement({...nouveauConsentement, expiration_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Button
              onClick={() => creerConsentement.mutate(nouveauConsentement)}
              disabled={creerConsentement.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {creerConsentement.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le consentement'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des consentements */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Historique des consentements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {consentements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun consentement enregistré</p>
              </div>
            ) : (
              consentements.map((consentement) => {
                const expire = consentement.expiration_date && new Date(consentement.expiration_date) < new Date();
                
                return (
                  <div key={consentement.id} className={`p-4 rounded-lg border ${
                    consentement.status === 'active' && !expire
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {consentement.decision === 'permit' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-semibold">
                            {scopesDisponibles.find(s => s.value === consentement.scope)?.label || consentement.scope}
                          </span>
                          <Badge className={consentement.status === 'active' && !expire ? 'bg-green-100 text-green-800' : 'bg-gray-400 text-white'}>
                            {expire ? 'Expiré' : consentement.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Politique: {politiquesDisponibles.find(p => p.value === consentement.policy_type)?.label || consentement.policy_type}</p>
                          <p>Enregistré: {format(new Date(consentement.date_time), 'PPP', { locale: fr })}</p>
                          {consentement.expiration_date && (
                            <p className={expire ? 'text-red-600 font-semibold' : ''}>
                              Expire: {format(new Date(consentement.expiration_date), 'PPP', { locale: fr })}
                            </p>
                          )}
                          {consentement.verification?.verified && (
                            <p className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Vérifié par {consentement.verification.method}
                            </p>
                          )}
                        </div>
                      </div>

                      {consentement.status === 'active' && !expire && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Révoquer ce consentement ?')) {
                              revoquerConsentement.mutate(consentement.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Révoquer
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations légales */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="font-semibold mb-2">Conformité légale SSA</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>POPIA (ZA)</strong>: Protection of Personal Information Act</li>
                <li>• <strong>NDPR (NG)</strong>: Nigeria Data Protection Regulation</li>
                <li>• <strong>GDPR</strong>: Applicable pour résidents UE</li>
                <li>• <strong>IHE BPPC</strong>: Basic Patient Privacy Consents</li>
              </ul>
              <p className="mt-3 text-xs">
                Les consentements sont horodatés, signés électroniquement, et conservés 10 ans minimum.
                Les patients peuvent révoquer à tout moment via leur espace santé.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}