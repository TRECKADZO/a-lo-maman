import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, AlertTriangle, Pill, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VueSynthese({ dossier }) {
  const alertesCritiques = dossier?.alertes_actives?.filter(a => a.severite === 'critique') || [];
  const antecedents = dossier?.antecedents_medicaux?.filter(a => a.statut === 'actif' || a.statut === 'chronique') || [];
  const traitements = dossier?.traitements_en_cours || [];

  return (
    <div className="space-y-6">
      {/* Informations patient */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Informations Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-semibold">{dossier?.patient_nom} {dossier?.patient_prenom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de naissance</p>
              <p className="font-semibold">
                {dossier?.date_naissance ? new Date(dossier.date_naissance).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
            {dossier?.numero_ins && (
              <div>
                <p className="text-sm text-gray-600">N° INS</p>
                <p className="font-mono font-semibold">{dossier.numero_ins}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes critiques */}
      {alertesCritiques.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Alertes Critiques
          </h3>
          {alertesCritiques.map((alerte, i) => (
            <Alert key={i} variant="destructive">
              <AlertDescription>{alerte.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Antécédents importants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Antécédents Médicaux Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {antecedents.length === 0 ? (
            <p className="text-gray-500">Aucun antécédent enregistré</p>
          ) : (
            <div className="space-y-2">
              {antecedents.map((atcd, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{atcd.libelle}</p>
                    {atcd.date_diagnostic && (
                      <p className="text-sm text-gray-500">
                        Depuis {new Date(atcd.date_diagnostic).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <Badge variant={atcd.statut === 'chronique' ? 'destructive' : 'default'}>
                    {atcd.statut}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traitements en cours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-green-500" />
            Traitements en Cours ({traitements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {traitements.length === 0 ? (
            <p className="text-gray-500">Aucun traitement actif</p>
          ) : (
            <div className="space-y-3">
              {traitements.slice(0, 5).map((t, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{t.medicament}</p>
                    {t.famille_therapeutique && (
                      <Badge variant="outline">{t.famille_therapeutique}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{t.posologie}</p>
                </div>
              ))}
              {traitements.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  + {traitements.length - 5} autres traitements
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dernière synchronisation */}
      {dossier?.derniere_synchronisation && (
        <p className="text-xs text-gray-500 text-center">
          Dernière synchronisation : {new Date(dossier.derniere_synchronisation).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
}