import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Eye,
  Search,
  Calendar,
  User,
  Loader2,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DocumentsMedicaux({ userEmail }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('tous');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents_medicaux', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.DocumentMedical.filter(
        { patient_email: userEmail },
        '-date_document'
      );
    },
    enabled: !!userEmail,
  });

  const marquerLuMutation = useMutation({
    mutationFn: async (docId) => {
      return await base44.entities.DocumentMedical.update(docId, {
        lu: true,
        date_lu: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_medicaux'] });
    }
  });

  const telechargerDocument = async (document) => {
    try {
      if (!document.lu) {
        marquerLuMutation.mutate(document.id);
      }
      
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: document.file_uri,
        expires_in: 300
      });
      
      window.open(signed_url, '_blank');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const typesLabels = {
    'ordonnance': { label: 'Ordonnance', icon: FileText, color: 'text-green-600 bg-green-50' },
    'resultat_labo': { label: 'Résultat labo', icon: FileText, color: 'text-blue-600 bg-blue-50' },
    'compte_rendu': { label: 'Compte rendu', icon: FileText, color: 'text-purple-600 bg-purple-50' },
    'radio': { label: 'Radiographie', icon: ImageIcon, color: 'text-orange-600 bg-orange-50' },
    'echographie': { label: 'Échographie', icon: ImageIcon, color: 'text-pink-600 bg-pink-50' },
    'rapport_specialiste': { label: 'Rapport', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    'certificat_medical': { label: 'Certificat', icon: FileText, color: 'text-teal-600 bg-teal-50' },
    'autre': { label: 'Autre', icon: File, color: 'text-gray-600 bg-gray-50' }
  };

  const documentsFilters = documents.filter(doc => {
    const matchSearch = !searchQuery || 
      doc.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchType = typeFilter === 'tous' || doc.type_document === typeFilter;
    
    return matchSearch && matchType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Mes documents médicaux</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white text-sm"
          >
            <option value="tous">Tous les types</option>
            {Object.entries(typesLabels).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {documentsFilters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentsFilters.map((doc) => {
            const typeInfo = typesLabels[doc.type_document] || typesLabels['autre'];
            const TypeIcon = typeInfo.icon;
            
            return (
              <Card key={doc.id} className="shadow-md hover:shadow-lg transition-shadow relative">
                {!doc.lu && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-500 text-white">Nouveau</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${typeInfo.color} rounded-xl`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                        {doc.titre}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(doc.date_document), 'dd MMMM yyyy', { locale: fr })}</span>
                        </div>
                        
                        {doc.professionnel_emetteur_nom && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="truncate">{doc.professionnel_emetteur_nom}</span>
                          </div>
                        )}
                        
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => telechargerDocument(doc)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Consulter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => telechargerDocument(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchQuery || typeFilter !== 'tous' 
                ? 'Aucun document trouvé'
                : 'Aucun document médical'
              }
            </p>
            <p className="text-sm text-gray-500">
              Les documents partagés par vos spécialistes apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}