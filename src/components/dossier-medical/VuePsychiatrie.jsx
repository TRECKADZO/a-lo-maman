import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Pill, AlertTriangle, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VuePsychiatrie({ dossier }) {
  const psyData = dossier?.donnees_psychiatrie || {};

  const interpreterMADRS = (score) => {
    if (score <= 6) return { label: 'Absence de dépression', color: 'green' };
    if (score <= 19) return { label: 'Dépression légère', color: 'yellow' };
    if (score <= 34) return { label: 'Dépression modérée', color: 'orange' };
    return { label: 'Dépression sévère', color: 'red' };
  };

  const interpreterGAD7 = (score) => {
    if (score <= 4) return { label: 'Anxiété minimale', color: 'green' };
    if (score <= 9) return { label: 'Anxiété légère', color: 'yellow' };
    if (score <= 14) return { label: 'Anxiété modérée', color: 'orange' };
    return { label: 'Anxiété sévère', color: 'red' };
  };

  return (
    <div className="space-y-6">
      {/* Alerte antécédents suicidaires */}
      {psyData.antecedents_suicidaires && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="font-semibold">
            ⚠️ Antécédents suicidaires - Vigilance accrue recommandée
          </AlertDescription>
        </Alert>
      )}

      {/* Scores psychométriques */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Score MADRS */}
        {psyData.score_madrs !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                MADRS (Dépression)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {psyData.score_madrs} / 60
              </div>
              <Badge className={`bg-${interpreterMADRS(psyData.score_madrs).color}-100 text-${interpreterMADRS(psyData.score_madrs).color}-800`}>
                {interpreterMADRS(psyData.score_madrs).label}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Score GAD-7 */}
        {psyData.score_gad7 !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                GAD-7 (Anxiété)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {psyData.score_gad7} / 21
              </div>
              <Badge className={`bg-${interpreterGAD7(psyData.score_gad7).color}-100 text-${interpreterGAD7(psyData.score_gad7).color}-800`}>
                {interpreterGAD7(psyData.score_gad7).label}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Score YMRS */}
        {psyData.score_ymrs !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                YMRS (Manie)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {psyData.score_ymrs} / 60
              </div>
              <p className="text-sm text-gray-600">
                {psyData.score_ymrs <= 7 ? '✓ Normal' :
                 psyData.score_ymrs <= 20 ? '⚠️ Hypomanie' :
                 '❌ Manie'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Psychotropes actuels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-indigo-500" />
            Traitements Psychotropes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!psyData.psychotropes_actuels || psyData.psychotropes_actuels.length === 0 ? (
            <p className="text-gray-500">Aucun traitement psychotrope actif</p>
          ) : (
            <div className="space-y-2">
              {psyData.psychotropes_actuels.map((med, i) => (
                <div key={i} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="font-semibold">{med}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hospitalisations */}
      {psyData.hospitalisations_psy?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hospitalisations Psychiatriques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {psyData.hospitalisations_psy.map((hosp, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{hosp.motif}</p>
                    <Badge variant="outline">{hosp.duree} jours</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(hosp.date_entree).toLocaleDateString('fr-FR')} - 
                    {new Date(hosp.date_sortie).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}