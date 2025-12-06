import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Conditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <Button
          asChild
          variant="ghost"
          className="mb-4 hover:bg-gray-200 active:scale-95 transition-transform"
        >
          <Link to={createPageUrl('Dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au menu
          </Link>
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
              <div className="p-2 bg-gray-200 rounded-lg">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
              </div>
              Conditions Générales d'Utilisation
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none p-6 md:p-8">
            <h2>1. Objet</h2>
            <p>
              Les présentes conditions générales d'utilisation (dites « CGU ») ont pour objet l'encadrement juridique des modalités de mise à disposition de l'application A'lo Maman et de définir les conditions d'accès et d'utilisation des services par « l'Utilisateur ».
            </p>
            
            <h2>2. Mentions légales</h2>
            <p>
              L'édition de l'application A'lo Maman est assurée par E-Medicare, Abidjan, e-mail : infos@e-medicare.co.
            </p>

            <h2>3. Accès à l'application</h2>
            <p>
              L'application est accessible gratuitement en tout lieu à tout Utilisateur ayant un accès à Internet. Tous les frais supportés par l'Utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.
            </p>

            <h2>4. Collecte des données</h2>
            <p>
              L'application assure à l'Utilisateur une collecte et un traitement d'informations personnelles dans le respect de la vie privée. Pour plus d'informations, consultez notre Politique de confidentialité.
            </p>
            
            <h2>5. Propriété intellectuelle</h2>
            <p>
              Les marques, logos, signes ainsi que tous les contenus de l'application (textes, images, son…) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur.
            </p>

            <p className="mt-8 text-sm text-gray-500">
              Dernière mise à jour : 1er Janvier 2025.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}