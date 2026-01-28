import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VueCardiologie({ dossier }) {
  const cardioData = dossier?.donnees_cardiologie || {};
  const observations = dossier?.observations_vitales?.filter(o => 
    ['tension', 'frequence_cardiaque', 'ecg'].includes(o.type)
  ) || [];
  const traitements = dossier?.traitements_en_cours?.filter(t => 
    ['anticoagulant', 'antihypertenseur', 'bêta-bloquant'].includes(t.famille_therapeutique)
  ) || [];

  const alertesCardio = dossier?.alertes_actives?.filter(a => 
    a.specialites_concernees?.includes('cardiologie')
  ) || [];

  const dernieresTensions = observations
    .filter(o => o.type === 'tension')
    .sort((a, b) => new Date(b.date_mesure) - new Date(a.date_mesure))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Alertes critiques */}
      {alertesCardio.length > 0 && (
        <div className="space-y-2">
          {alertesCardio.map((alerte, i) => (
            <Alert key={i} variant={alerte.severite === 'critique' ? 'destructive' : 'default'}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{alerte.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Score de risque */}
      {cardioData.score_cha2ds2_vasc !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Score CHA2DS2-VASc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {cardioData.score_cha2ds2_vasc}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {cardioData.score_cha2ds2_vasc >= 2 ? 
                '⚠️ Anticoagulation recommandée' : 
                '✓ Risque faible à modéré'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pression artérielle récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Pression Artérielle Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dernieresTensions.length === 0 ? (
            <p className="text-gray-500">Aucune mesure récente</p>
          ) : (
            <div className="space-y-3">
              {dernieresTensions.map((obs, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-lg">{obs.valeur}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(obs.date_mesure).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {obs.notes && (
                    <Badge variant="outline">{obs.notes}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anticoagulants */}
      {cardioData.anticoagulants?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Anticoagulants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cardioData.anticoagulants.map((med, i) => (
                <Badge key={i} className="mr-2 bg-red-100 text-red-800">
                  {med}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traitements cardio */}
      <Card>
        <CardHeader>
          <CardTitle>Traitements Cardiovasculaires</CardTitle>
        </CardHeader>
        <CardContent>
          {traitements.length === 0 ? (
            <p className="text-gray-500">Aucun traitement actif</p>
          ) : (
            <div className="space-y-3">
              {traitements.map((t, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{t.medicament}</p>
                    <Badge>{t.famille_therapeutique}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{t.posologie}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Depuis le {new Date(t.date_debut).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fraction d'éjection */}
      {cardioData.fraction_ejection && (
        <Card>
          <CardHeader>
            <CardTitle>Fraction d'Éjection Ventriculaire Gauche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cardioData.fraction_ejection}%
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {cardioData.fraction_ejection >= 50 ? '✓ Normale' : 
               cardioData.fraction_ejection >= 40 ? '⚠️ Légèrement diminuée' : 
               '❌ Altérée'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}