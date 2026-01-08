import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export default function FiltresAvances({
  searchQuery,
  onSearchChange,
  filterStatut,
  onStatutChange,
  filterType,
  onTypeChange,
  filterFHIR,
  onFHIRChange,
  filterRegion,
  onRegionChange,
  regions = [],
  onReset
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const types = [
    'Tous les types',
    'Clinique privée',
    'Hôpital public',
    'Centre de santé',
    'Maternité',
    'PMI',
    'Centre téléchographie'
  ];

  const statuts = ['Tous les statuts', 'En attente', 'Approuvé', 'Rejeté', 'Actif', 'Inactif'];

  const hasActiveFilters = searchQuery || filterStatut !== 'tous' || filterType !== 'tous' || filterFHIR !== 'tous' || filterRegion !== 'tous';

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtres et Recherche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de recherche principale */}
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, région..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
        </div>

        {/* Filtres rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filterStatut}
            onChange={(e) => onStatutChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {statuts.map(s => (
              <option key={s} value={s.toLowerCase().replace(' ', '_')}>{s}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {types.map(t => (
              <option key={t} value={t.toLowerCase().replace(' ', '_')}>{t}</option>
            ))}
          </select>

          <select
            value={filterFHIR}
            onChange={(e) => onFHIRChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tous">Tous (FHIR)</option>
            <option value="enabled">FHIR activée</option>
            <option value="disabled">FHIR désactivée</option>
          </select>

          <select
            value={filterRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tous">Toutes régions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Tags des filtres actifs */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600 font-medium">Filtres actifs:</span>
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onSearchChange('')} />
              </Badge>
            )}
            {filterStatut !== 'tous' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Statut: {filterStatut}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onStatutChange('tous')} />
              </Badge>
            )}
            {filterFHIR !== 'tous' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                FHIR: {filterFHIR}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onFHIRChange('tous')} />
              </Badge>
            )}
            {filterRegion !== 'tous' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filterRegion}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onRegionChange('tous')} />
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="text-xs text-indigo-600 hover:text-indigo-700 ml-auto"
            >
              Réinitialiser tous les filtres
            </Button>
          </div>
        )}

        {/* Info texte */}
        <p className="text-xs text-gray-500">
          💡 Utilisez les filtres pour affiner votre recherche et trouver rapidement les centres que vous cherchez.
        </p>
      </CardContent>
    </Card>
  );
}