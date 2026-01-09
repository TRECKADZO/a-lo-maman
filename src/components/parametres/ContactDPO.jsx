import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Shield, ExternalLink } from 'lucide-react';

export default function ContactDPO() {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Responsable Protection des Données (DPO)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge className="bg-purple-600">RGPD Compliant</Badge>

        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg">
            <p className="font-semibold text-lg text-purple-900">Dr. Jean-Marie Dupont</p>
            <p className="text-sm text-gray-600 mb-3">Data Protection Officer (DPO)</p>

            <div className="space-y-2">
              <a
                href="mailto:dpo@alomaman.ci"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:underline"
              >
                <Mail className="w-4 h-4" />
                dpo@alomaman.ci
              </a>
              <a
                href="tel:+22507XXXXXXXX"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:underline"
              >
                <Phone className="w-4 h-4" />
                +225 07 XX XX XX XX
              </a>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">Nous contacter pour :</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li>Exercer vos droits RGPD</li>
              <li>Signaler une violation de données</li>
              <li>Questions sur la confidentialité</li>
              <li>Demandes de conformité</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full"
            >
              <a href="https://alomaman.ci/politique-confidentialite">
                <ExternalLink className="w-3 h-3 mr-1" />
                Politique
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full"
            >
              <a href="https://alomaman.ci/conditions">
                <ExternalLink className="w-3 h-3 mr-1" />
                Conditions
              </a>
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-500 bg-white p-3 rounded">
          Conformément au RGPD, nous avons désigné un DPO pour vous aider à exercer vos droits et gérer vos données personnelles en toute sécurité.
        </p>
      </CardContent>
    </Card>
  );
}