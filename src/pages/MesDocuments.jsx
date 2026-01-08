import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Search,
  Plus,
  Filter,
  FolderOpen,
  Baby,
  User,
  Users,
  Star,
  Archive,
  Share2,
  Loader2,
  File,
  Image,
  FileImage,
  Pill,
  Stethoscope,
  TestTube,
  Heart,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentCard from '@/components/documents/DocumentCard';
import AjouterDocument from '@/components/documents/AjouterDocument';
import DetailDocument from '@/components/documents/DetailDocument';

const TYPES_DOCUMENTS = [
  { id: 'ordonnance', label: 'Ordonnance', icon: Pill, color: 'blue' },
  { id: 'resultat_labo', label: 'Résultat labo', icon: TestTube, color: 'purple' },
  { id: 'certificat_medical', label: 'Certificat médical', icon: FileText, color: 'green' },
  { id: 'certificat_vaccination', label: 'Certificat vaccination', icon: Heart, color: 'pink' },
  { id: 'radio_imagerie', label: 'Radio/Imagerie', icon: FileImage, color: 'indigo' },
  { id: 'echographie', label: 'Échographie', icon: Image, color: 'cyan' },
  { id: 'compte_rendu', label: 'Compte-rendu', icon: FileText, color: 'amber' },
  { id: 'courrier_specialiste', label: 'Courrier spécialiste', icon: Stethoscope, color: 'teal' },
  { id: 'carnet_sante', label: 'Carnet de santé', icon: Heart, color: 'rose' },
  { id: 'facture', label: 'Facture', icon: File, color: 'gray' },
  { id: 'autre', label: 'Autre', icon: File, color: 'slate' },
];

export default function MesDocuments() {
  const [showAjouter, setShowAjouter] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMembre, setFilterMembre] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('tous');
  const [sortBy, setSortBy] = useState('date_desc');

  // Fetch data
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documents_famille'],
    queryFn: () => base44.entities.DocumentFamille.list('-created_date'),
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.EnfantCarnet.list(),
  });

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let result = documents;

    // Filter by tab
    if (activeTab === 'favoris') {
      result = result.filter(d => d.favori);
    } else if (activeTab === 'partages') {
      result = result.filter(d => d.partages && d.partages.length > 0);
    } else if (activeTab === 'archives') {
      result = result.filter(d => d.archive);
    } else {
      result = result.filter(d => !d.archive);
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(d => d.type_document === filterType);
    }

    // Filter by membre
    if (filterMembre !== 'all') {
      if (filterMembre === 'maman') {
        result = result.filter(d => d.membre_type === 'maman');
      } else if (filterMembre === 'famille') {
        result = result.filter(d => d.membre_type === 'famille');
      } else {
        result = result.filter(d => d.enfant_id === filterMembre);
      }
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.titre?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.professionnel?.toLowerCase().includes(query) ||
        d.etablissement?.toLowerCase().includes(query) ||
        d.mots_cles?.some(m => m.toLowerCase().includes(query))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date_document || b.created_date) - new Date(a.date_document || a.created_date);
        case 'date_asc':
          return new Date(a.date_document || a.created_date) - new Date(b.date_document || b.created_date);
        case 'titre_asc':
          return (a.titre || '').localeCompare(b.titre || '');
        case 'titre_desc':
          return (b.titre || '').localeCompare(a.titre || '');
        case 'type':
          return (a.type_document || '').localeCompare(b.type_document || '');
        default:
          return 0;
      }
    });

    return result;
  }, [documents, activeTab, filterType, filterMembre, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: documents.filter(d => !d.archive).length,
    favoris: documents.filter(d => d.favori).length,
    partages: documents.filter(d => d.partages && d.partages.length > 0).length,
    archives: documents.filter(d => d.archive).length,
  }), [documents]);

  // Group by membre
  const documentsByMembre = useMemo(() => {
    const groups = {
      maman: documents.filter(d => d.membre_type === 'maman' && !d.archive),
      famille: documents.filter(d => d.membre_type === 'famille' && !d.archive),
    };
    
    enfants.forEach(e => {
      groups[e.id] = documents.filter(d => d.enfant_id === e.id && !d.archive);
    });
    
    return groups;
  }, [documents, enfants]);

  const getTypeInfo = (typeId) => {
    return TYPES_DOCUMENTS.find(t => t.id === typeId) || TYPES_DOCUMENTS.find(t => t.id === 'autre');
  };

  if (loadingDocs) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 pb-24">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <Card className="shadow-xl border-none rounded-3xl overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <FolderOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Mes Documents Médicaux</h1>
                    <p className="text-blue-100 text-sm">Stockage sécurisé pour toute la famille</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowAjouter(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un document
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-xs text-blue-900">Documents</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600">{stats.favoris}</p>
                <p className="text-xs text-amber-900">Favoris</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <Share2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.partages}</p>
                <p className="text-xs text-green-900">Partagés</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-none shadow-lg">
              <CardContent className="p-4 text-center">
                <Archive className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-600">{stats.archives}</p>
                <p className="text-xs text-gray-900">Archivés</p>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filters */}
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par titre, professionnel, mots-clés..."
                    className="pl-10 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`rounded-xl ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t">
                     <div>
                       <label className="text-sm font-medium text-gray-700 mb-1 block">Type de document</label>
                       <Select value={filterType} onValueChange={setFilterType}>
                         <SelectTrigger className="rounded-xl">
                           <SelectValue placeholder="Tous les types" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Tous les types</SelectItem>
                           {TYPES_DOCUMENTS.map(type => (
                             <SelectItem key={type.id} value={type.id}>
                               {type.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-700 mb-1 block">Membre de la famille</label>
                       <Select value={filterMembre} onValueChange={setFilterMembre}>
                         <SelectTrigger className="rounded-xl">
                           <SelectValue placeholder="Tous les membres" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Tous les membres</SelectItem>
                           <SelectItem value="maman">
                             <div className="flex items-center gap-2">
                               <User className="w-4 h-4" /> Moi
                             </div>
                           </SelectItem>
                           <SelectItem value="famille">
                             <div className="flex items-center gap-2">
                               <Users className="w-4 h-4" /> Famille
                             </div>
                           </SelectItem>
                           {enfants.map(enfant => (
                             <SelectItem key={enfant.id} value={enfant.id}>
                               <div className="flex items-center gap-2">
                                 <Baby className="w-4 h-4" /> {enfant.prenom}
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-700 mb-1 block">Trier par</label>
                       <Select value={sortBy} onValueChange={setSortBy}>
                         <SelectTrigger className="rounded-xl">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="date_desc">Date (plus récent)</SelectItem>
                           <SelectItem value="date_asc">Date (plus ancien)</SelectItem>
                           <SelectItem value="titre_asc">Titre (A-Z)</SelectItem>
                           <SelectItem value="titre_desc">Titre (Z-A)</SelectItem>
                           <SelectItem value="type">Type</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Tabs & Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 bg-white rounded-2xl shadow-md">
              <TabsTrigger 
                value="tous"
                className="rounded-xl py-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Tous
              </TabsTrigger>
              <TabsTrigger 
                value="favoris"
                className="rounded-xl py-3 data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                <Star className="w-4 h-4 mr-2" />
                Favoris
              </TabsTrigger>
              <TabsTrigger 
                value="partages"
                className="rounded-xl py-3 data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partagés
              </TabsTrigger>
              <TabsTrigger 
                value="archives"
                className="rounded-xl py-3 data-[state=active]:bg-gray-500 data-[state=active]:text-white"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archives
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredDocuments.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <DocumentCard
                          document={doc}
                          typeInfo={getTypeInfo(doc.type_document)}
                          enfants={enfants}
                          onClick={() => setSelectedDocument(doc)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">
                      {searchQuery || filterType !== 'all' || filterMembre !== 'all'
                        ? 'Aucun document trouvé avec ces critères'
                        : 'Aucun document dans cette catégorie'}
                    </p>
                    {activeTab === 'tous' && !searchQuery && (
                      <Button onClick={() => setShowAjouter(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter votre premier document
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Organisation par membre */}
          {activeTab === 'tous' && !searchQuery && filterType === 'all' && filterMembre === 'all' && (
            <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Documents par membre
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Maman */}
                  <div 
                    className="flex items-center justify-between p-4 bg-pink-50 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors"
                    onClick={() => setFilterMembre('maman')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">Mes documents</span>
                    </div>
                    <Badge variant="secondary">{documentsByMembre.maman?.length || 0}</Badge>
                  </div>

                  {/* Enfants */}
                  {enfants.map(enfant => (
                    <div 
                      key={enfant.id}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setFilterMembre(enfant.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                          <Baby className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">{enfant.prenom}</span>
                      </div>
                      <Badge variant="secondary">{documentsByMembre[enfant.id]?.length || 0}</Badge>
                    </div>
                  ))}

                  {/* Famille */}
                  <div 
                    className="flex items-center justify-between p-4 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => setFilterMembre('famille')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">Documents famille</span>
                    </div>
                    <Badge variant="secondary">{documentsByMembre.famille?.length || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal Ajouter */}
        {showAjouter && (
          <AjouterDocument
            enfants={enfants}
            onClose={() => setShowAjouter(false)}
          />
        )}

        {/* Modal Détail */}
        {selectedDocument && (
          <DetailDocument
            document={selectedDocument}
            enfants={enfants}
            onClose={() => setSelectedDocument(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
}