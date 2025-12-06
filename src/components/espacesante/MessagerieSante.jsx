import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Lock, Video } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function MessagerieSante({ userEmail }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Messagerie sécurisée</h2>
      
      <Card className="shadow-md">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-teal-600" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Communiquez avec vos spécialistes
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Accédez à votre messagerie sécurisée pour échanger avec vos professionnels de santé en toute confidentialité
          </p>

          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>Chiffré de bout en bout</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-600" />
              <span>Vidéoconsultation</span>
            </div>
          </div>

          <Button 
            onClick={() => navigate(createPageUrl('Messagerie'))}
            className="bg-teal-600 hover:bg-teal-700"
            size="lg"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Ouvrir la messagerie
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}