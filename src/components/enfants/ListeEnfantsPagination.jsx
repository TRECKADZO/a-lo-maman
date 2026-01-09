import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Pagination } from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import VueEnfantResume from './VueEnfantResume';

export default function ListeEnfantsPagination() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: enfants = [], isLoading } = useQuery({
    queryKey: ['enfants', user?.email],
    queryFn: async () => {
      return await base44.entities.EnfantCarnet.filter({ 
        created_by: user.email 
      });
    },
    enabled: !!user,
  });

  // Filtrer par recherche
  const filteredEnfants = enfants.filter(enfant => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      enfant.prenom?.toLowerCase().includes(query) ||
      enfant.nom?.toLowerCase().includes(query) ||
      enfant.numero_cmu?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalItems = filteredEnfants.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEnfants = filteredEnfants.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Rechercher par prénom, nom ou N° CMU..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Liste des enfants */}
      {paginatedEnfants.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            {searchQuery ? 'Aucun enfant trouvé' : 'Aucun carnet d\'enfant'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedEnfants.map(enfant => (
            <VueEnfantResume key={enfant.id} enfant={enfant} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}