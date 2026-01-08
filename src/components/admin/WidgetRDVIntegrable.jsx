import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Code, CheckCircle } from 'lucide-react';

export default function WidgetRDVIntegrable({ centreId, centreName }) {
  const [copied, setCopied] = useState(false);

  // Code HTML intégrable
  const widgetCode = `<!-- Widget A'lo Maman - Prise RDV -->
<div id="alomaman-rdv-widget"></div>
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://alomaman.ci/widget/rdv.js';
    script.dataset.centreId = '${centreId}';
    script.dataset.centreName = '${centreName}';
    document.body.appendChild(script);
  })();
</script>`;

  const embedCode = `<iframe 
  src="https://alomaman.ci/widget/rdv-embed?centre=${centreId}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border: none; border-radius: 8px;"
></iframe>`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Code className="w-6 h-6" />
          Widget RDV Intégrable
        </h2>
        <Badge variant="outline" className="bg-blue-50">Code intégration</Badge>
      </div>

      {/* Instructions */}
      <Card className="shadow-lg border-none bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-700 mb-4">
            Intégrez notre widget de prise de rendez-vous directement sur votre site. 
            Les patients peuvent réserver sans quitter votre site et les RDV s'ajoutent automatiquement.
          </p>
          <div className="space-y-2 text-xs text-blue-800">
            <div>✓ Réservation en temps réel</div>
            <div>✓ Synchronisation automatique</div>
            <div>✓ Facturation intégrée</div>
            <div>✓ Rappels SMS/Email automatiques</div>
          </div>
        </CardContent>
      </Card>

      {/* Option 1: Code HTML */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-lg">Option 1: Intégration HTML simple</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Copier-coller ce code dans le HTML de votre site</p>
          <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
              {widgetCode}
            </code>
          </div>
          <Button
            onClick={() => copyToClipboard(widgetCode)}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copié!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copier le code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Option 2: iFrame */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-lg">Option 2: Intégration iFrame</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Alternative avec iFrame (plus simple mais moins flexible)</p>
          <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
              {embedCode}
            </code>
          </div>
          <Button
            onClick={() => copyToClipboard(embedCode)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copié!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copier le code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Personnalisation */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-lg">Paramètres de personnalisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Couleur primaire</p>
              <code className="text-xs text-gray-600">data-primary-color="#FF6B9D"</code>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Afficher l'image du centre</p>
              <code className="text-xs text-gray-600">data-show-image="true"</code>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Langue</p>
              <code className="text-xs text-gray-600">data-language="fr" | "en"</code>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Pré-sélectionner un type</p>
              <code className="text-xs text-gray-600">data-type-consultation="consultation_prenatale"</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Card className="shadow-lg border-none bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg text-green-900">Suivi des RDV via le widget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-800 mb-4">
            Tous les RDV pris via le widget apparaissent automatiquement dans votre gestion RDV avec le tag "source: widget_externe"
          </p>
          <Button variant="outline" className="w-full">
            Voir les stats du widget
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}