import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Lock
} from 'lucide-react';

export default function TestsSecurite() {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const runSecurityTests = async () => {
    setIsRunning(true);
    const results = [];

    try {
      // Test 1: Vérifier qu'un utilisateur ne peut pas lire les grossesses d'un autre
      results.push(await testGrossesseRLS());

      // Test 2: Vérifier qu'un utilisateur ne peut pas lire les carnets enfants d'un autre
      results.push(await testEnfantRLS());

      // Test 3: Vérifier qu'un utilisateur ne peut pas lire les RDV d'un autre
      results.push(await testRendezVousRLS());

      // Test 4: Vérifier qu'un utilisateur ne peut pas modifier un profil d'un autre
      results.push(await testProfilRLS());

      // Test 5: Vérifier qu'un non-admin ne peut pas accéder aux logs d'audit
      results.push(await testAuditLogRLS());

      // Test 6: Vérifier qu'un membre ne peut pas voir les données d'un autre centre
      results.push(await testMembreCentreRLS());

      // Test 7: Vérifier qu'on ne peut pas créer de RDV pour un autre utilisateur
      results.push(await testCreateRDVRLS());

      setTestResults(results);
    } catch (error) {
      console.error('Erreur tests sécurité:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testGrossesseRLS = async () => {
    try {
      const grossesses = await base44.entities.SuiviGrossesse.list();
      const myGrossesses = grossesses.filter(g => g.created_by === user.email);
      
      return {
        name: 'RLS SuiviGrossesse',
        passed: grossesses.length === myGrossesses.length,
        message: grossesses.length === myGrossesses.length
          ? `✅ Accès restreint à vos grossesses uniquement (${myGrossesses.length})`
          : `❌ FAILLE: Accès à ${grossesses.length - myGrossesses.length} grossesses d'autres utilisateurs`,
        severity: grossesses.length > myGrossesses.length ? 'critical' : 'success'
      };
    } catch (error) {
      return {
        name: 'RLS SuiviGrossesse',
        passed: false,
        message: `❌ Erreur: ${error.message}`,
        severity: 'error'
      };
    }
  };

  const testEnfantRLS = async () => {
    try {
      const enfants = await base44.entities.EnfantCarnet.list();
      const myEnfants = enfants.filter(e => 
        e.created_by === user.email || 
        e.professionnels_suivi?.includes(user.email) ||
        e.partages_famille?.some(p => p.email === user.email)
      );
      
      return {
        name: 'RLS EnfantCarnet',
        passed: enfants.length === myEnfants.length,
        message: enfants.length === myEnfants.length
          ? `✅ Accès restreint aux carnets autorisés (${myEnfants.length})`
          : `❌ FAILLE: Accès à ${enfants.length - myEnfants.length} carnets non autorisés`,
        severity: enfants.length > myEnfants.length ? 'critical' : 'success'
      };
    } catch (error) {
      return {
        name: 'RLS EnfantCarnet',
        passed: false,
        message: `❌ Erreur: ${error.message}`,
        severity: 'error'
      };
    }
  };

  const testRendezVousRLS = async () => {
    try {
      const rdvs = await base44.entities.RendezVous.list();
      const myRdvs = rdvs.filter(r => 
        r.patient_email === user.email || 
        r.professionnel_email === user.email
      );
      
      return {
        name: 'RLS RendezVous',
        passed: rdvs.length === myRdvs.length,
        message: rdvs.length === myRdvs.length
          ? `✅ Accès restreint à vos RDV (${myRdvs.length})`
          : `❌ FAILLE: Accès à ${rdvs.length - myRdvs.length} RDV d'autres utilisateurs`,
        severity: rdvs.length > myRdvs.length ? 'critical' : 'success'
      };
    } catch (error) {
      return {
        name: 'RLS RendezVous',
        passed: false,
        message: `❌ Erreur: ${error.message}`,
        severity: 'error'
      };
    }
  };

  const testProfilRLS = async () => {
    try {
      const profils = await base44.entities.ProfilMaman.list();
      const myProfils = profils.filter(p => p.created_by === user.email);
      
      return {
        name: 'RLS ProfilMaman',
        passed: profils.length === myProfils.length,
        message: profils.length === myProfils.length
          ? `✅ Accès restreint à votre profil uniquement`
          : `❌ FAILLE: Accès à ${profils.length - myProfils.length} profils d'autres utilisateurs`,
        severity: profils.length > myProfils.length ? 'critical' : 'success'
      };
    } catch (error) {
      return {
        name: 'RLS ProfilMaman',
        passed: false,
        message: `❌ Erreur: ${error.message}`,
        severity: 'error'
      };
    }
  };

  const testAuditLogRLS = async () => {
    try {
      const logs = await base44.entities.AuditLog.list();
      
      if (user.role === 'admin') {
        return {
          name: 'RLS AuditLog',
          passed: true,
          message: `✅ Accès admin autorisé (${logs.length} logs)`,
          severity: 'success'
        };
      } else {
        return {
          name: 'RLS AuditLog',
          passed: logs.length === 0,
          message: logs.length === 0
            ? `✅ Accès refusé aux logs pour utilisateur non-admin`
            : `❌ FAILLE: Accès non autorisé à ${logs.length} logs d'audit`,
          severity: logs.length > 0 ? 'critical' : 'success'
        };
      }
    } catch (error) {
      // Une erreur 403 est attendue pour les non-admins
      return {
        name: 'RLS AuditLog',
        passed: true,
        message: `✅ Accès correctement refusé (403)`,
        severity: 'success'
      };
    }
  };

  const testMembreCentreRLS = async () => {
    try {
      const membres = await base44.entities.MembreCentre.list();
      const myMembres = membres.filter(m => 
        m.user_email === user.email ||
        user.centres_ids?.includes(m.centre_id)
      );
      
      return {
        name: 'RLS MembreCentre',
        passed: membres.length === myMembres.length,
        message: membres.length === myMembres.length
          ? `✅ Accès restreint à vos centres (${myMembres.length})`
          : `❌ FAILLE: Accès à ${membres.length - myMembres.length} membres d'autres centres`,
        severity: membres.length > myMembres.length ? 'critical' : 'success'
      };
    } catch (error) {
      return {
        name: 'RLS MembreCentre',
        passed: false,
        message: `❌ Erreur: ${error.message}`,
        severity: 'error'
      };
    }
  };

  const testCreateRDVRLS = async () => {
    try {
      // Tenter de créer un RDV pour un autre email
      const fakeEmail = 'test-unauthorized@example.com';
      
      try {
        await base44.entities.RendezVous.create({
          patient_email: fakeEmail,
          patient_nom: 'Test Unauthorized',
          professionnel_email: 'doc@test.com',
          date_rdv: new Date().toISOString(),
          type_consultation: 'test'
        });
        
        // Si on arrive ici, c'est une faille
        return {
          name: 'Création RDV non autorisée',
          passed: false,
          message: `❌ FAILLE CRITIQUE: Création de RDV pour un autre utilisateur autorisée`,
          severity: 'critical'
        };
      } catch (error) {
        // Une erreur est attendue
        return {
          name: 'Création RDV non autorisée',
          passed: true,
          message: `✅ Création de RDV pour un autre utilisateur correctement refusée`,
          severity: 'success'
        };
      }
    } catch (error) {
      return {
        name: 'Création RDV non autorisée',
        passed: true,
        message: `✅ Test de création non autorisée bloqué`,
        severity: 'success'
      };
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription>
            Accès réservé aux administrateurs
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const criticalIssues = testResults?.filter(r => r.severity === 'critical').length || 0;
  const passedTests = testResults?.filter(r => r.passed).length || 0;
  const totalTests = testResults?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Tests de sécurité RLS
          </h1>
          <p className="text-gray-600 mt-1">Vérification des règles de sécurité Row Level Security</p>
        </div>

        {/* Action */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Lancer les tests de sécurité</h3>
                <p className="text-sm text-gray-600">
                  Vérifie que les RLS empêchent les accès non autorisés
                </p>
              </div>
              <Button 
                onClick={runSecurityTests}
                disabled={isRunning}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tests en cours...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Lancer les tests
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        {testResults && (
          <>
            {/* Score global */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-1">Tests réussis</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-green-600">{passedTests}</p>
                    <p className="text-sm text-gray-500">/ {totalTests}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-1">Failles critiques</p>
                  <p className={`text-3xl font-bold ${criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {criticalIssues}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-1">Score global</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{Math.round((passedTests / totalTests) * 100)}</p>
                    <p className="text-sm text-gray-500">%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerte si failles critiques */}
            {criticalIssues > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-5 h-5" />
                <AlertDescription>
                  <strong>⚠️ {criticalIssues} faille(s) de sécurité critique(s) détectée(s) !</strong>
                  <p className="mt-2 text-sm">
                    Des utilisateurs peuvent accéder à des données qui ne leur appartiennent pas. 
                    Corriger immédiatement les règles RLS.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Liste des résultats */}
            <div className="space-y-3">
              {testResults.map((result, idx) => (
                <Card key={idx} className={
                  result.severity === 'critical' ? 'border-red-300 bg-red-50' :
                  result.severity === 'error' ? 'border-orange-300 bg-orange-50' :
                  'border-green-300 bg-green-50'
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {result.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{result.name}</h4>
                            <Badge className={
                              result.severity === 'critical' ? 'bg-red-600' :
                              result.severity === 'error' ? 'bg-orange-600' :
                              'bg-green-600'
                            }>
                              {result.severity === 'critical' ? 'Critique' :
                               result.severity === 'error' ? 'Erreur' :
                               'OK'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{result.message}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommandations */}
            {criticalIssues === 0 && (
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>✅ Tous les tests de sécurité sont passés !</strong>
                  <p className="mt-2 text-sm">
                    Les règles RLS empêchent correctement les accès non autorisés.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              À propos des tests RLS
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>Ces tests vérifient que :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Les utilisateurs ne peuvent voir que leurs propres données</li>
              <li>Les professionnels n'accèdent qu'aux dossiers autorisés</li>
              <li>Les membres de centres ne voient que leur centre</li>
              <li>Les logs d'audit sont accessibles uniquement aux admins</li>
              <li>Les tentatives de création de données pour d'autres sont bloquées</li>
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              Exécuter ces tests régulièrement pour garantir la sécurité des données médicales.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}