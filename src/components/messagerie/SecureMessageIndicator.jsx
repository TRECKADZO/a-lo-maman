import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye,
  CheckCircle
} from 'lucide-react';

/**
 * Indicateur de sécurité pour la messagerie
 * Affiche l'état du chiffrement et la protection des données
 */
export default function SecureMessageIndicator({ isEncrypted = true, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Shield className="w-3 h-3 text-green-600" />
        <span>Chiffré de bout en bout</span>
      </div>
    );
  }

  return (
    <Alert className="bg-green-50 border-green-200 mb-4">
      <Shield className="w-4 h-4 text-green-600" />
      <AlertDescription className="text-green-900">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold mb-2">🔒 Messagerie sécurisée et privée</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Chiffrement de bout en bout AES-256</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Stockage sécurisé des fichiers médicaux</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Conforme RGPD et réglementations santé</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Seuls vous et votre spécialiste pouvez lire les messages</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className="bg-green-600 text-white">
              <Lock className="w-3 h-3 mr-1" />
              Sécurisé
            </Badge>
            <Badge className="bg-blue-600 text-white">
              <Eye className="w-3 h-3 mr-1" />
              Privé
            </Badge>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}