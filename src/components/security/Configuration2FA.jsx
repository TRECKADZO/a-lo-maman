import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Check, Copy, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Configuration2FA({ user }) {
  const [showSetup, setShowSetup] = useState(false);
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [tempCode, setTempCode] = useState('');

  const { data: auth2FA } = useQuery({
    queryKey: ['auth2fa', user?.email],
    queryFn: async () => {
      const result = await base44.entities.Authentification2FA.filter({
        user_email: user.email
      });
      return result[0] || null;
    },
    enabled: !!user,
  });

  const initialiserMutation = useMutation({
    mutationFn: async () => {
      return await base44.asServiceRole.functions.invoke('gerer2FA', {
        action: 'initialiser',
        methode: 'totp'
      });
    },
    onSuccess: (data) => {
      setTempCode(data.code_temporaire);
      setBackupCodes(data.codes_secours);
      setStep(2);
    },
    onError: () => {
      toast.error('Erreur lors de l\'initialisation');
    }
  });

  const validerMutation = useMutation({
    mutationFn: async () => {
      return await base44.asServiceRole.functions.invoke('gerer2FA', {
        action: 'valider',
        code
      });
    },
    onSuccess: () => {
      toast.success('2FA activé avec succès !');
      setStep(3);
    },
    onError: () => {
      toast.error('Code incorrect');
      setCode('');
    }
  });

  const desactiverMutation = useMutation({
    mutationFn: async () => {
      return await base44.asServiceRole.functions.invoke('gerer2FA', {
        action: 'desactiver'
      });
    },
    onSuccess: () => {
      toast.success('2FA désactivé');
      setShowSetup(false);
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Authentification à deux facteurs (2FA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {auth2FA?.active ? (
          <>
            <Alert className="bg-green-50 border-green-200">
              <Check className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ 2FA activé</strong>
                <p className="text-sm mt-1">
                  Dernière vérification: {new Date(auth2FA.derniere_verification).toLocaleString('fr-FR')}
                </p>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Codes de secours disponibles</p>
              <p className="text-xs text-blue-800 mb-3">
                {auth2FA.codes_secours?.filter(c => !c.utilise).length} / {auth2FA.codes_secours?.length} codes restants
              </p>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600"
                  style={{ width: `${((auth2FA.codes_secours?.filter(c => !c.utilise).length || 0) / (auth2FA.codes_secours?.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => desactiverMutation.mutate()}
              disabled={desactiverMutation.isPending}
              className="w-full"
            >
              {desactiverMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Désactivation...
                </>
              ) : (
                'Désactiver 2FA'
              )}
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertTriangle className="w-5 h-5" />
              <AlertDescription>
                Activez 2FA pour sécuriser votre compte professionnel
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => {
                setShowSetup(true);
                setStep(1);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              Activer 2FA
            </Button>
          </>
        )}
      </CardContent>

      {/* Dialog setup */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {step === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>Activer 2FA</DialogTitle>
                <DialogDescription>
                  Étape 1: Initialisation
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Vous allez recevoir un code temporaire à entrer dans une application d'authentification comme Google Authenticator.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => initialiserMutation.mutate()}
                  disabled={initialiserMutation.isPending}
                  className="w-full"
                >
                  {initialiserMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initialisation...
                    </>
                  ) : (
                    'Commencer'
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Confirmer 2FA</DialogTitle>
                <DialogDescription>
                  Étape 2: Vérification du code
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Code temporaire</p>
                  <div className="flex items-center justify-between bg-white p-3 rounded border border-amber-200">
                    <code className="font-mono text-lg tracking-wider">{tempCode}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(tempCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code2fa">Entrez le code depuis votre app d'authentification</Label>
                  <Input
                    id="code2fa"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  onClick={() => validerMutation.mutate()}
                  disabled={validerMutation.isPending || code.length !== 6}
                  className="w-full"
                >
                  {validerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    'Vérifier'
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <DialogHeader>
                <DialogTitle>2FA activé ✓</DialogTitle>
                <DialogDescription>
                  Étape 3: Codes de secours
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Check className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    2FA activé avec succès !
                  </AlertDescription>
                </Alert>

                <div>
                  <p className="text-sm font-semibold mb-2">📝 Codes de secours</p>
                  <p className="text-xs text-gray-600 mb-3">
                    Sauvegardez ces codes en lieu sûr. Vous en aurez besoin si vous perdez accès à votre app d'authentification.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border space-y-1 max-h-40 overflow-y-auto">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-mono">
                        <span>{code}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(code)}
                          className="h-auto p-1"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowSetup(false);
                    setStep(1);
                    setCode('');
                  }}
                  className="w-full"
                >
                  Terminer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}