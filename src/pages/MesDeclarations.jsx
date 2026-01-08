import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Calendar, Download, Eye, 
  CheckCircle, Clock, AlertCircle, Baby,
  ArrowRight, Copy, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import AuthGuard from '../components/auth/AuthGuard';

export default function MesDeclarations() {
  const [copiedId, setCopiedId] = React.useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: declarations = [], isLoading } = useQuery({
    queryKey: ['mes_declarations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.DeclarationNaissance.filter(
        { maman_email: user.email },
        '-created_date'
      );
    },
    enabled: !!user,
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.EnfantCarnet.list('-created_date'),
    initialData: []
  });

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'transmise': return 'bg-blue-100 text-blue-800';
      case 'soumise': return 'bg-orange-100 text-orange-800';
      case 'brouillon': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'complete': return CheckCircle;
      case 'transmise': return Clock;
      case 'soumise': return AlertCircle;
      default: return FileText;
    }
  };

  const copyNumeroSuivi = (numero) => {
    navigator.clipboard.writeText(numero);
    setCopiedId(numero);
    toast.success('Numéro copié !');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stats = {
    total: declarations.length,
    complete: declarations.filter(d => d.statut === 'complete').length,
    enCours: declarations.filter(d => d.statut === 'soumise' || d.statut === 'transmise').length,
    brouillon: declarations.filter(d => d.statut === 'brouillon').length,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Mes Déclarations de Naissance
            </h1>
            <p className="text-gray-600">
              Gérez les déclarations de vos enfants
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-pink-600">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
                <p className="text-xs text-gray-600">Complètes</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.enCours}</p>
                <p className="text-xs text-gray-600">En cours</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.brouillon}</p>
                <p className="text-xs text-gray-600">Brouillons</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Nouvelle déclaration */}
          {declarations.length === 0 && (
            <Card className="shadow-lg border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
              <CardContent className="p-6 text-center">
                <Baby className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Aucune déclaration pour le moment
                </h3>
                <p className="text-gray-600 mb-4">
                  Déclarez la naissance de votre bébé facilement
                </p>
                <Button asChild className="bg-gradient-to-r from-pink-500 to-rose-600">
                  <Link to={createPageUrl('DeclarationNaissance')}>
                    <Baby className="w-5 h-5 mr-2" />
                    Déclarer une naissance
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Liste des déclarations */}
          {declarations.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Historique</h2>
                <Button asChild variant="outline">
                  <Link to={createPageUrl('DeclarationNaissance')}>
                    <Baby className="w-4 h-4 mr-2" />
                    Nouvelle déclaration
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                {declarations.map((declaration) => {
                  const StatutIcon = getStatutIcon(declaration.statut);
                  const enfantAssocie = enfants.find(e => e.id === declaration.enfant_id);

                  return (
                    <Card key={declaration.id} className="shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                              <Baby className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {declaration.prenoms_enfant} {declaration.nom_famille}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {format(new Date(declaration.date_naissance), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatutColor(declaration.statut)}>
                            <StatutIcon className="w-3 h-3 mr-1" />
                            {declaration.statut}
                          </Badge>
                        </div>

                        {/* Informations */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Numéro de suivi</span>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono bg-white px-2 py-1 rounded">
                                {declaration.numero_suivi}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyNumeroSuivi(declaration.numero_suivi)}
                              >
                                {copiedId === declaration.numero_suivi ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Lieu</span>
                            <span className="text-sm font-medium">{declaration.lieu_naissance}</span>
                          </div>
                          {declaration.no_acte_naissance && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">N° Acte</span>
                              <Badge variant="outline">{declaration.no_acte_naissance}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          {declaration.pdf_declaration_url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(declaration.pdf_declaration_url, '_blank')}
                              className="w-full"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          )}
                          
                          {enfantAssocie ? (
                            <Button
                              asChild
                              className="w-full bg-gradient-to-r from-pink-500 to-rose-600"
                            >
                              <Link to={createPageUrl('Enfants')}>
                                <Baby className="w-4 h-4 mr-2" />
                                Voir carnet
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                            >
                              <Baby className="w-4 h-4 mr-2" />
                              Créer carnet
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Info délai légal */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Délai légal : 60 jours
                  </p>
                  <p className="text-xs text-blue-700">
                    En Côte d'Ivoire, la déclaration de naissance doit être effectuée dans les 60 jours 
                    suivant l'accouchement auprès de l'état civil de votre commune.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}