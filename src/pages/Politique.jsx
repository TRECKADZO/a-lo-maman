import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Politique() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8 pb-safe">
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <Button
          asChild
          variant="ghost"
          className="mb-4 hover:bg-green-100 active:scale-95 transition-transform"
        >
          <Link to={createPageUrl('Dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au menu
          </Link>
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
              <div className="p-2 bg-green-200 rounded-lg">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-green-700" />
              </div>
              Politique de Confidentialité
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none p-6 md:p-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 mb-1"><strong>Éditeur :</strong> E-Medicare</p>
              <p className="text-sm text-green-800 mb-1"><strong>Adresse :</strong> Abidjan, Côte d'Ivoire</p>
              <p className="text-sm text-green-800"><strong>Contact :</strong> infos@e-medicare.co</p>
            </div>

            <h2>1. Introduction</h2>
            <p>
              La présente Politique de Confidentialité décrit comment E-Medicare ("nous", "notre" ou "nos") collecte, utilise, stocke et protège vos informations personnelles lorsque vous utilisez l'application A'lo Maman. Nous nous engageons à protéger votre vie privée et à traiter vos données personnelles conformément à la réglementation en vigueur.
            </p>

            <h2>2. Données collectées</h2>
            <p>Nous collectons les types de données suivants :</p>
            <h3>2.1 Données que vous nous fournissez directement :</h3>
            <ul>
              <li><strong>Informations de compte :</strong> nom, prénom, adresse e-mail, numéro de téléphone</li>
              <li><strong>Données de santé :</strong> informations sur le cycle menstruel, grossesse, contraception, données de santé de vos enfants (vaccinations, croissance, développement)</li>
              <li><strong>Données médicales :</strong> groupe sanguin, allergies, antécédents médicaux, ordonnances</li>
              <li><strong>Contenus :</strong> photos, documents médicaux, messages</li>
            </ul>
            <h3>2.2 Données collectées automatiquement :</h3>
            <ul>
              <li>Type d'appareil et système d'exploitation</li>
              <li>Identifiants de l'appareil</li>
              <li>Données d'utilisation de l'application</li>
              <li>Adresse IP</li>
            </ul>

            <h2>3. Utilisation des données</h2>
            <p>Vos données personnelles sont utilisées pour :</p>
            <ul>
              <li>Fournir et personnaliser nos services de suivi de santé maternelle et infantile</li>
              <li>Gérer vos rendez-vous avec des professionnels de santé</li>
              <li>Envoyer des rappels de vaccinations et de rendez-vous</li>
              <li>Vous envoyer des notifications pertinentes (rappels, conseils santé)</li>
              <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
              <li>Assurer la sécurité de votre compte et de nos services</li>
              <li>Répondre à vos demandes d'assistance</li>
            </ul>

            <h2>4. Protection des données de santé</h2>
            <p>
              Vos données de santé sont considérées comme des données sensibles et bénéficient d'une protection renforcée :
            </p>
            <ul>
              <li>Chiffrement des données en transit et au repos</li>
              <li>Accès strictement limité et contrôlé</li>
              <li>Stockage sécurisé sur des serveurs protégés</li>
              <li>Notre équipe n'accède pas à vos données de santé personnelles sauf pour des raisons techniques avec votre accord</li>
            </ul>

            <h2>5. Partage des données</h2>
            <p>
              <strong>Nous ne vendons jamais vos données personnelles.</strong> Vos données peuvent être partagées uniquement dans les cas suivants :
            </p>
            <ul>
              <li><strong>Avec les professionnels de santé :</strong> uniquement les données nécessaires à votre suivi médical, avec votre consentement</li>
              <li><strong>Prestataires techniques :</strong> hébergement, envoi d'e-mails (sous contrat de confidentialité strict)</li>
              <li><strong>Obligations légales :</strong> si requis par la loi ou une autorité compétente</li>
            </ul>

            <h2>6. Conservation des données</h2>
            <p>
              Vos données sont conservées pendant toute la durée de votre utilisation de l'application, puis supprimées dans un délai de 3 ans après la suppression de votre compte, sauf obligation légale de conservation plus longue.
            </p>

            <h2>7. Vos droits</h2>
            <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à : <strong>infos@e-medicare.co</strong>
            </p>

            <h2>8. Sécurité des données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Ces mesures incluent le chiffrement SSL/TLS, l'authentification sécurisée, et des audits de sécurité réguliers.
            </p>

            <h2>9. Données des enfants</h2>
            <p>
              L'application permet aux parents de gérer les données de santé de leurs enfants. Ces données sont traitées avec le même niveau de protection que les données des adultes et sont accessibles uniquement par les parents/tuteurs légaux et les professionnels de santé autorisés.
            </p>

            <h2>10. Modifications de la politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité. Toute modification sera notifiée via l'application ou par e-mail. Nous vous encourageons à consulter régulièrement cette page.
            </p>

            <h2>11. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous :
            </p>
            <ul>
              <li><strong>E-mail :</strong> infos@e-medicare.co</li>
              <li><strong>Adresse :</strong> E-Medicare, Abidjan, Côte d'Ivoire</li>
            </ul>
            
            <p className="mt-8 text-sm text-gray-500">
              Dernière mise à jour : 4 Décembre 2024
            </p>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: max(6rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}