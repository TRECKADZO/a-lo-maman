import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Search, Filter } from 'lucide-react';

export default function RecherchePatientsAvancee({ onClose, onSearch }) {
  const [criteres, setCriteres] = useState({
    nom: '',
    prenom: '',
    age_min: '',
    age_max: '',
    sexe: '',
    allergies: '',
    numero_cmu: ''
  });

  const handleSearch = () => {
    onSearch(criteres);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-teal-600" />
              <span className="truncate">Recherche avancée</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input
                value={criteres.prenom}
                onChange={(e) => setCriteres({ ...criteres, prenom: e.target.value })}
                placeholder="Ex: Marie"
              />
            </div>

            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={criteres.nom}
                onChange={(e) => setCriteres({ ...criteres, nom: e.target.value })}
                placeholder="Ex: Koné"
              />
            </div>

            <div className="space-y-2">
              <Label>N° CMU</Label>
              <Input
                value={criteres.numero_cmu}
                onChange={(e) => setCriteres({ ...criteres, numero_cmu: e.target.value })}
                placeholder="Ex: 123456789"
              />
            </div>

            <div className="space-y-2">
              <Label>Sexe</Label>
              <select
                value={criteres.sexe}
                onChange={(e) => setCriteres({ ...criteres, sexe: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Tous</option>
                <option value="masculin">Masculin</option>
                <option value="feminin">Féminin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Âge minimum (mois)</Label>
              <Input
                type="number"
                value={criteres.age_min}
                onChange={(e) => setCriteres({ ...criteres, age_min: e.target.value })}
                placeholder="Ex: 0"
              />
            </div>

            <div className="space-y-2">
              <Label>Âge maximum (mois)</Label>
              <Input
                type="number"
                value={criteres.age_max}
                onChange={(e) => setCriteres({ ...criteres, age_max: e.target.value })}
                placeholder="Ex: 24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allergies (recherche)</Label>
            <Input
              value={criteres.allergies}
              onChange={(e) => setCriteres({ ...criteres, allergies: e.target.value })}
              placeholder="Ex: arachide, pénicilline..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSearch} className="flex-1 bg-teal-600 hover:bg-teal-700">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}