import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Pill, FileText, TrendingUp } from 'lucide-react';

export default function VueOncologie({ dossier }) {
  const oncoData = dossier?.donnees_oncologie || {};

  return (
    <div className="space-y-6">
      {/* Classification TNM */}
      {oncoData.stade_tnm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Classification TNM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Badge className="text-lg px-4 py-2 bg-purple-100 text-purple-800">
                  {oncoData.stade_tnm}
                </Badge>
              </div>
              {oncoData.type_cancer && (
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold">{oncoData.type_cancer}</p>
                </div>
              )}
              {oncoData.date_diagnostic && (
                <div>
                  <p className="text-sm text-gray-600">Date de diagnostic</p>
                  <p className="font-semibold">
                    {new Date(oncoData.date_diagnostic).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histologie */}
      {oncoData.histologie && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Analyse Histologique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{oncoData.histologie}</p>
          </CardContent>
        </Card>
      )}

      {/* Chimiothérapie en cours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-500" />
            Traitement Oncologique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {oncoData.chimiotherapie_en_cours ? (
            <div className="space-y-3">
              <Badge className="bg-blue-100 text-blue-800">
                Chimiothérapie en cours
              </Badge>
              {oncoData.protocole_actuel && (
                <div>
                  <p className="text-sm text-gray-600">Protocole</p>
                  <p className="font-semibold">{oncoData.protocole_actuel}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Aucun traitement actif</p>
          )}
        </CardContent>
      </Card>

      {/* Marqueurs tumoraux */}
      {oncoData.marqueurs_tumoraux?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Marqueurs Tumoraux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {oncoData.marqueurs_tumoraux.map((marqueur, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{marqueur.nom}</p>
                    <Badge variant={marqueur.normal ? 'default' : 'destructive'}>
                      {marqueur.valeur} {marqueur.unite}
                    </Badge>
                  </div>
                  {marqueur.date && (
                    <p className="text-xs text-gray-500">
                      {new Date(marqueur.date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}