import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Baby,
  Calendar,
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  MapPin,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AuthGuard from '../components/auth/AuthGuard';

export default function MesDeclarations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: declarations = [], isLoading } = useQuery({
    queryKey: ['mes_declarations', user?.email],
    queryFn: async () => {
      const decls = await base44.entities.DeclarationNaissance.filter(
        { maman_email: user.email },
        '-created_date'
      );
      return decls;
    },
    enabled: !!user,
  });

  const filteredDeclarations = declarations.filter(d => {
    const matchSearch = 
      d.prenoms_enfant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.nom_famille?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.numero_suivi?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatut = filterStatut === 'all' || d.statut === filterStatut;

    return matchSearch && matchStatut;
  });

  const statutConfig = {
    brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: Clock },
    soumise: { label: 'Soumise', color: 'bg-blue-100 text-blue-800', icon: Clock },
    transmise: { label: 'Transmise', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
    validee: { label: 'Validée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    complete: { label: 'Complète', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mes Déclarations</h1>
                <p className="text-gray-600 text-sm">Historique des déclarations de naissance</p>
              </div>
              <Link to={createPageUrl('DeclarationNaissance')}>
                <Button className="bg-gradient-to-r from-pink-500 to-rose-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par prénom, nom ou n° de suivi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="soumise">Soumise</option>
                <option value="transmise">Transmise</option>
                <option value="validee">Validée</option>
                <option value="complete">Complète</option>
              </select>
            </div>
          </div>

          {/* Liste des déclarations */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : filteredDeclarations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchTerm || filterStatut !== 'all' ? 'Aucun résultat' : 'Aucune déclaration'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatut !== 'all' 
                    ? 'Essayez d\'ajuster vos filtres' 
                    : 'Vous n\'avez pas encore déclaré de naissance'
                  }
                </p>
                {!searchTerm && filterStatut === 'all' && (
                  <Link to={createPageUrl('DeclarationNaissance')}>
                    <Button className="bg-gradient-to-r from-pink-500 to-rose-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle déclaration
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDeclarations.map((declaration) => {
                const config = statutConfig[declaration.statut] || statutConfig.brouillon;
                const StatutIcon = config.icon;

                return (
                  <Card key={declaration.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Baby className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {declaration.prenoms_enfant} {declaration.nom_famille}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge className={config.color}>
                                <StatutIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              <Badge variant="outline">
                                {declaration.sexe === 'garcon' ? 'Garçon' : 'Fille'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Né(e) le {format(new Date(declaration.date_naissance), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                            <p className="text-sm text-gray-500">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {declaration.lieu_naissance}, {declaration.ville}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-500">N° de suivi</p>
                          <code className="text-sm font-mono font-semibold text-gray-900">
                            {declaration.numero_suivi}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          {declaration.pdf_declaration_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(declaration.pdf_declaration_url, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}