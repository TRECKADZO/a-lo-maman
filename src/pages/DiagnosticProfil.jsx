import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function DiagnosticProfil() {
  const [manualFetchResult, setManualFetchResult] = useState(null);
  const [manualFetchLoading, setManualFetchLoading] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro, isLoading: profilProLoading, error: profilProError } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      console.log('🔍 DIAGNOSTIC - Fetching Professionnel');
      console.log('📧 Email recherché:', user.email);
      
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      
      console.log('📊 Résultats bruts:', profils);
      console.log('📊 Nombre de profils:', profils.length);
      
      if (profils.length > 0) {
        console.log('✅ Premier profil:', profils[0]);
      }
      
      return profils[0] || null;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: allProfessionnels, isLoading: allProLoading } = useQuery({
    queryKey: ['all_professionnels'],
    queryFn: async () => {
      console.log('🔍 DIAGNOSTIC - Fetching ALL Professionnels');
      const all = await base44.entities.Professionnel.list();
      console.log('📊 Tous les professionnels:', all);
      return all;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const handleManualFetch = async () => {
    if (!user) return;
    
    setManualFetchLoading(true);
    setManualFetchResult(null);
    
    try {
      console.log('\n🔬 === TEST MANUEL - DÉBUT ===');
      console.log('👤 User email:', user.email);
      console.log('👤 User object:', user);
      
      // Test 1: Fetch avec filter email
      console.log('\n📝 Test 1: Filter par email');
      const test1 = await base44.entities.Professionnel.filter({ email: user.email });
      console.log('Résultat Test 1:', test1);
      
      // Test 2: List all puis filter côté client
      console.log('\n📝 Test 2: List all puis filter');
      const test2 = await base44.entities.Professionnel.list();
      console.log('Tous les profils:', test2);
      const filtered = test2.filter(p => p.email === user.email);
      console.log('Filtré côté client:', filtered);
      
      // Test 3: Filter avec created_by
      console.log('\n📝 Test 3: Filter par created_by');
      const test3 = await base44.entities.Professionnel.filter({ created_by: user.email });
      console.log('Résultat Test 3:', test3);
      
      console.log('\n🔬 === TEST MANUEL - FIN ===\n');
      
      setManualFetchResult({
        test1: test1.length,
        test2: filtered.length,
        test3: test3.length,
        allProfils: test2.length,
        details: {
          test1Result: test1,
          filteredResult: filtered,
          test3Result: test3
        }
      });
    } catch (err) {
      console.error('❌ Erreur test manuel:', err);
      setManualFetchResult({ error: err.message });
    } finally {
      setManualFetchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-teal-500">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              🔬 Diagnostic Profil Professionnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">👤 Utilisateur Connecté</h3>
              {userLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : user ? (
                <div className="space-y-1 font-mono text-sm">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Nom:</strong> {user.full_name}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </div>
              ) : (
                <p className="text-red-600">❌ Aucun utilisateur</p>
              )}
            </div>

            {/* Query Result */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">📊 Résultat Query React</h3>
              {profilProLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : profilProError ? (
                <div className="text-red-600">
                  <p><strong>❌ Erreur:</strong> {profilProError.message}</p>
                </div>
              ) : profilPro ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle className="w-6 h-6" />
                    <span>PROFIL TROUVÉ !</span>
                  </div>
                  <div className="font-mono text-sm space-y-1 bg-white p-3 rounded">
                    <p><strong>ID:</strong> {profilPro.id}</p>
                    <p><strong>Email:</strong> {profilPro.email}</p>
                    <p><strong>Nom:</strong> {profilPro.nom_complet}</p>
                    <p><strong>Spécialité:</strong> {profilPro.specialite}</p>
                    <p><strong>Ville:</strong> {profilPro.ville}</p>
                    <p><strong>Région:</strong> {profilPro.region}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <XCircle className="w-6 h-6" />
                  <span>AUCUN PROFIL TROUVÉ</span>
                </div>
              )}
            </div>

            {/* All Professionnels */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">📋 Tous les Professionnels</h3>
              {allProLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : allProfessionnels ? (
                <div className="space-y-2">
                  <p className="font-bold">Total: {allProfessionnels.length} profil(s)</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allProfessionnels.map(p => (
                      <div key={p.id} className={`p-2 rounded text-sm font-mono ${p.email === user?.email ? 'bg-green-200 border-2 border-green-600' : 'bg-white'}`}>
                        <p><strong>Email:</strong> {p.email}</p>
                        <p><strong>Nom:</strong> {p.nom_complet}</p>
                        <p><strong>ID:</strong> {p.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Aucun profil</p>
              )}
            </div>

            {/* Manual Test */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">🧪 Test Manuel</h3>
              <Button 
                onClick={handleManualFetch} 
                disabled={manualFetchLoading || !user}
                className="mb-3"
              >
                {manualFetchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Lancer les tests
                  </>
                )}
              </Button>

              {manualFetchResult && (
                <div className="bg-white p-4 rounded font-mono text-sm space-y-2">
                  {manualFetchResult.error ? (
                    <p className="text-red-600">❌ {manualFetchResult.error}</p>
                  ) : (
                    <>
                      <p><strong>Test 1 (filter email):</strong> {manualFetchResult.test1} résultat(s)</p>
                      <p><strong>Test 2 (list + filter client):</strong> {manualFetchResult.test2} résultat(s)</p>
                      <p><strong>Test 3 (filter created_by):</strong> {manualFetchResult.test3} résultat(s)</p>
                      <p><strong>Total profils BDD:</strong> {manualFetchResult.allProfils}</p>
                      
                      <details className="mt-4">
                        <summary className="cursor-pointer font-bold">Détails complets (cliquer)</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
                          {JSON.stringify(manualFetchResult.details, null, 2)}
                        </pre>
                      </details>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-400">
              <h3 className="font-bold mb-2">📋 Instructions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Vérifiez que votre email est bien affiché</li>
                <li>Vérifiez si votre profil apparaît en VERT dans "Tous les Professionnels"</li>
                <li>Cliquez sur "Lancer les tests" et ouvrez F12 &gt; Console</li>
                <li>Regardez les résultats des 3 tests</li>
                <li>Copiez TOUT ce qui apparaît dans la console</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}