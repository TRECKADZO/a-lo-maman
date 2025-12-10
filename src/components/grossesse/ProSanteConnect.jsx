import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';

/**
 * Intégration Pro Santé Connect (PSC)
 * Authentification sécurisée des professionnels de santé
 * Accès DMP des patientes avec consentement
 */

export default function ProSanteConnect({ patientEmail, onDMPAccess }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [dmpStatus, setDmpStatus] = useState(null);

  const initiatePSCAuth = async () => {
    setIsConnecting(true);
    try {
      // Pro Santé Connect OAuth 2.0 flow
      const pscAuthUrl = 'https://auth.esw.esante.gouv.fr/auth';
      const clientId = 'ALOMAMAN_CLIENT_ID'; // À configurer
      const redirectUri = `${window.location.origin}/psc-callback`;
      const scope = 'openid scope_all'; // Scopes PSC
      
      const state = crypto.randomUUID();
      sessionStorage.setItem('psc_state', state);
      
      const authUrl = `${pscAuthUrl}?` + new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state
      });

      // Ouvrir popup OAuth
      const popup = window.open(authUrl, 'PSC Auth', 'width=600,height=700');
      
      // Écouter le callback
      window.addEventListener('message', handlePSCCallback);
      
    } catch (error) {
      console.error('[PSC] Auth error:', error);
      toast.error("Erreur d'authentification Pro Santé Connect");
      setIsConnecting(false);
    }
  };

  const handlePSCCallback = async (event) => {
    if (event.data.type === 'psc_success') {
      const { code, state } = event.data;
      
      // Vérifier state
      if (state !== sessionStorage.getItem('psc_state')) {
        toast.error('Erreur de sécurité OAuth');
        return;
      }

      // Échanger code contre token
      const tokenResponse = await fetch('/functions/proSanteConnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'exchange_token',
          code,
          redirect_uri: `${window.location.origin}/psc-callback`
        })
      });

      const { access_token, id_token } = await tokenResponse.json();

      // Vérifier consentement patiente pour accès DMP
      await requestDMPAccess(access_token);
      
      setIsConnecting(false);
      toast.success('Authentifié via Pro Santé Connect ✅');
    }
  };

  const requestDMPAccess = async (accessToken) => {
    try {
      // Vérifier consentement patiente
      const consentements = await base44.entities.ConsentementBPPC.filter({
        patient_email: patientEmail,
        policy_type: 'opt-in',
        status: 'active'
      });

      if (consentements.length === 0) {
        toast.error('La patiente n\'a pas donné son consentement pour accès DMP');
        return;
      }

      // Accéder au DMP via API eSanté
      const dmpResponse = await fetch('/functions/proSanteConnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'access_dmp',
          access_token: accessToken,
          patient_email: patientEmail
        })
      });

      const dmpData = await dmpResponse.json();
      
      setDmpStatus({
        connected: true,
        documents: dmpData.documents || [],
        lastSync: new Date().toISOString()
      });

      if (onDMPAccess) {
        onDMPAccess(dmpData);
      }

      toast.success(`Accès DMP obtenu : ${dmpData.documents.length} documents`);
      
    } catch (error) {
      console.error('[DMP] Access error:', error);
      toast.error('Erreur accès DMP');
    }
  };

  return (
    <Card className="shadow-lg border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Pro Santé Connect & DMP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 mb-2">
                Authentification sécurisée des professionnels
              </p>
              <p className="text-sm text-blue-800 mb-3">
                Pro Santé Connect permet aux professionnels de santé de s'authentifier 
                via leur carte CPS/CPF et d'accéder au Dossier Médical Partagé (DMP) 
                des patientes ayant donné leur consentement.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-blue-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Certifié ANS
                </Badge>
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conforme HDS
                </Badge>
                <Badge className="bg-purple-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  RGPD
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {!dmpStatus ? (
          <Button
            onClick={initiatePSCAuth}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Shield className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connexion en cours...' : 'Se connecter avec Pro Santé Connect'}
          </Button>
        ) : (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">DMP accessible</span>
              </div>
              <Badge className="bg-green-600 text-white">
                {dmpStatus.documents.length} documents
              </Badge>
            </div>
            <p className="text-xs text-green-700">
              Dernière synchro : {new Date(dmpStatus.lastSync).toLocaleString('fr-FR')}
            </p>
          </div>
        )}

        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-800">
                <strong>Consentement requis :</strong> La patiente doit avoir accepté 
                le partage de données dans ses paramètres avant tout accès DMP.
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://esante.gouv.fr/produits-services/pro-sante-connect"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          En savoir plus sur Pro Santé Connect
          <ExternalLink className="w-3 h-3" />
        </a>
      </CardContent>
    </Card>
  );
}