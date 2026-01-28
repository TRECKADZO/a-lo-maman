import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, RefreshCw, Users, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function MonCodeLiaison() {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionnel } = useQuery({
    queryKey: ['professionnel', user?.email],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.list();
      return pros.find(p => p.email === user.email);
    },
    enabled: !!user,
  });

  const regenererCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('gererCodeLiaison', {
        action: 'generer_code',
      });
      return response.data.code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professionnel']);
      toast.success('Code régénéré avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la génération du code');
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(professionnel?.code_liaison || '');
    setCopied(true);
    toast.success('Code copié');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!professionnel) {
    return null;
  }

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-teal-600" />
          Mon Code de Liaison Patient
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Partagez ce code avec vos patients pour qu'ils vous ajoutent comme professionnel de santé
          </p>
          
          <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl p-8 border-2 border-teal-200">
            <div className="text-5xl font-bold text-teal-700 tracking-widest">
              {professionnel.code_liaison || 'XXXXXX'}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le code
                </>
              )}
            </Button>
            <Button
              onClick={() => regenererCodeMutation.mutate()}
              variant="outline"
              disabled={regenererCodeMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 ${regenererCodeMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Patients liés via ce code
            </span>
            <span className="font-semibold text-teal-600">
              {professionnel.patients_lies_count || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}