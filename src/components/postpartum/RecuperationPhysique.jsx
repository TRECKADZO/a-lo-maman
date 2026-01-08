import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, AlertCircle } from 'lucide-react';

export default function RecuperationPhysique({ suivi }) {
  const recuperation = suivi.recuperation_physique || {};

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          Récupération physique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suivi.type_accouchement === 'cesarienne' && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Cicatrisation césarienne
            </p>
            <p className="text-xs text-blue-800 mb-2">
              La cicatrice nécessite des soins pendant 2-3 semaines. 
              Surveillez les signes d'infection (rougeur, chaleur, écoulement).
            </p>
            {recuperation.cicatrisation_cesarienne && (
              <Badge className={
                recuperation.cicatrisation_cesarienne === 'bonne' ? 'bg-green-500' :
                recuperation.cicatrisation_cesarienne === 'moyenne' ? 'bg-orange-500' :
                'bg-red-500'
              }>
                {recuperation.cicatrisation_cesarienne}
              </Badge>
            )}
          </div>
        )}

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-900 mb-2">
            <Heart className="w-4 h-4 inline mr-1" />
            Rééducation périnéale
          </p>
          <p className="text-xs text-purple-800 mb-2">
            Prescrite lors de la consultation post-natale (6 semaines). 
            10 séances en moyenne sont remboursées par la CMU.
          </p>
          {recuperation.reeducation_perineale?.prescrite && (
            <Badge className="bg-purple-500 text-white">
              ✓ Prescrite
            </Badge>
          )}
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-semibold text-green-900 mb-2">
            Conseils récupération
          </p>
          <ul className="text-xs text-green-800 space-y-1">
            <li>• Reposez-vous dès que possible</li>
            <li>• Hydratez-vous bien</li>
            <li>• Alimentation équilibrée et riche en fer</li>
            <li>• Marche douce après 2-3 semaines</li>
            <li>• Évitez port de charges lourdes (6 semaines)</li>
            <li>• Reprise sport intense après consultation</li>
          </ul>
        </div>

        <div className="bg-red-50 rounded-lg p-3 text-xs text-red-900 border border-red-200">
          <AlertCircle className="w-4 h-4 mb-1" />
          <p className="font-semibold mb-1">Signes d'alerte - consultez :</p>
          <ul className="space-y-1">
            <li>• Fièvre &gt; 38°C</li>
            <li>• Douleurs abdominales intenses</li>
            <li>• Saignements très abondants</li>
            <li>• Rougeur/chaleur cicatrice</li>
            <li>• Douleurs mollet (phlébite)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}