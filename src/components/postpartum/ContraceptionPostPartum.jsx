import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Info, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ContraceptionPostPartum({ suivi }) {
  const contraception = suivi.contraception_postpartum;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Pill className="w-5 h-5 text-rose-600" />
          Contraception post-partum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
          <p className="text-sm font-semibold text-pink-900 mb-2">
            <Info className="w-4 h-4 inline mr-1" />
            Retour de couches
          </p>
          <p className="text-xs text-pink-800 mb-2">
            Le retour de couches intervient généralement 6 à 8 semaines après l'accouchement 
            (plus tard si allaitement exclusif).
          </p>
          {suivi.retour_couches?.date_retour && (
            <Badge className="bg-pink-500 text-white">
              ✓ Retour le {new Date(suivi.retour_couches.date_retour).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-900 mb-2">
            💡 Reprise de la contraception
          </p>
          <p className="text-xs text-purple-800 mb-3">
            La contraception peut être reprise 3 semaines après l'accouchement 
            (6 semaines si allaitement). Certaines méthodes sont compatibles avec l'allaitement.
          </p>
          <Link to={createPageUrl('Contraception')}>
            <Button className="w-full bg-purple-500">
              <Heart className="w-4 h-4 mr-2" />
              Explorer les méthodes
            </Button>
          </Link>
        </div>

        <div className="space-y-2 text-xs text-gray-700">
          <p className="font-semibold">Méthodes compatibles allaitement :</p>
          <ul className="space-y-1 pl-4">
            <li>✓ Progestatifs seuls (pilule microprogestative)</li>
            <li>✓ Implant</li>
            <li>✓ DIU (cuivre ou hormonal)</li>
            <li>✓ Préservatifs</li>
            <li>✓ Méthode MAMA (si allaitement exclusif)</li>
          </ul>
          <p className="text-red-600 font-semibold mt-2">
            ✗ Pilules œstroprogestatives : contre-indiquées pendant l'allaitement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}