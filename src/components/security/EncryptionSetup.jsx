import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
  Info,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

export default function EncryptionSetup() {
  const [showDetails, setShowDetails] = useState(false);

  // Vérifier si le chiffrement est disponible dans le navigateur
  const isAvailable = typeof window !== 'undefined' && 
                      window.crypto && 
                      window.crypto.subtle;

  return (
    <Card className="shadow-lg border-none bg-card mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className={`w-6 h-6 ${isAvailable ? 'text-green-600' : 'text-orange-600'}`} />
            Chiffrement de bout en bout
          </CardTitle>
          {isAvailable && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Actif
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut */}
        {isAvailable ? (
          <Alert className="bg-green-50 border-green-200">
            <Lock className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Vos données médicales sont protégées</strong>
              <p className="text-sm mt-1">
                Toutes vos données sensibles sont chiffrées de bout en bout avec un algorithme AES-256-GCM.
                Vous seul(e) pouvez les déchiffrer.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Chiffrement non disponible</strong>
              <p className="text-sm mt-1">
                Le chiffrement de bout en bout nécessite un navigateur moderne.
                Vos données sont protégées par HTTPS mais pas chiffrées localement.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Données protégées */}
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Quelles données sont protégées ?
            </span>
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          {showDetails && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Carnets de santé des enfants</p>
                  <p className="text-xs text-gray-600">
                    Historique médical, allergies, maladies chroniques, vaccins
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Suivi de grossesse</p>
                  <p className="text-xs text-gray-600">
                    Données personnelles, consultations prénatales, examens médicaux
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Messagerie privée</p>
                  <p className="text-xs text-gray-600">
                    Contenu des messages avec les professionnels de santé
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Rendez-vous médicaux</p>
                  <p className="text-xs text-gray-600">
                    Notes patient et professionnel, motifs de consultation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Profil santé personnel</p>
                  <p className="text-xs text-gray-600">
                    Groupe sanguin, allergies, antécédents médicaux
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informations techniques */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Comment ça fonctionne ?
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Algorithme:</strong> AES-256-GCM (Standard militaire)</li>
                <li>• <strong>Clé unique:</strong> Générée automatiquement pour chaque utilisateur</li>
                <li>• <strong>Stockage:</strong> Clé stockée uniquement sur votre appareil</li>
                <li>• <strong>Transmission:</strong> Seules les données chiffrées sont envoyées au serveur</li>
                <li>• <strong>Déchiffrement:</strong> Uniquement possible avec votre clé locale</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Avertissement */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription className="text-sm">
            <strong>Important :</strong> Si vous vous déconnectez ou changez d'appareil, 
            assurez-vous de sauvegarder vos données. Le chiffrement de bout en bout signifie 
            que même nous ne pouvons pas récupérer vos données sans votre clé.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}