import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Filter,
  CheckCircle,
  X,
  CreditCard,
  Calendar,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const LANGUES_DISPONIBLES = [
  'Français',
  'Anglais',
  'Arabe',
  'Espagnol',
  'Baoulé',
  'Dioula',
  'Bété',
  'Senoufo',
  'Malinké',
  'Agni',
  'Gouro',
  'Yacouba',
  'Attié'
];

const ASSURANCES_DISPONIBLES = [
  'CMU (Couverture Maladie Universelle)',
  'MUGEF-CI',
  'CGRAE',
  'AXA Assurances',
  'NSIA Assurances',
  'Saham Assurance',
  'SUNU Assurances',
  'Allianz',
  'AGF'
];

export default function FiltresAvances({ filtres, onFiltresChange }) {
  const [expanded, setExpanded] = useState(false);

  const handleToggleFiltre = (key, value) => {
    onFiltresChange({ ...filtres, [key]: value });
  };

  const handleToggleLangue = (langue) => {
    const langues = filtres.langues || [];
    const newLangues = langues.includes(langue)
      ? langues.filter(l => l !== langue)
      : [...langues, langue];
    onFiltresChange({ ...filtres, langues: newLangues });
  };

  const handleToggleAssurance = (assurance) => {
    const assurances = filtres.assurances || [];
    const newAssurances = assurances.includes(assurance)
      ? assurances.filter(a => a !== assurance)
      : [...assurances, assurance];
    onFiltresChange({ ...filtres, assurances: newAssurances });
  };

  const resetFiltres = () => {
    onFiltresChange({
      accepte_cmu: false,
      disponible_weekend: false,
      langues: [],
      assurances: []
    });
  };

  const nombreFiltresActifs = 
    (filtres.accepte_cmu ? 1 : 0) +
    (filtres.disponible_weekend ? 1 : 0) +
    (filtres.langues?.length || 0) +
    (filtres.assurances?.length || 0);

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-600" />
            Filtres avancés
            {nombreFiltresActifs > 0 && (
              <Badge className="ml-2 bg-teal-600">
                {nombreFiltresActifs}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {nombreFiltresActifs > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFiltres}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  Réduire <ChevronUp className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Afficher <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Filtres rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-semibold">Accepte CMU</Label>
                  <p className="text-xs text-gray-600">
                    Couverture Maladie Universelle
                  </p>
                </div>
              </div>
              <Switch
                checked={filtres.accepte_cmu || false}
                onCheckedChange={(checked) => handleToggleFiltre('accepte_cmu', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="font-semibold">Disponible le week-end</Label>
                  <p className="text-xs text-gray-600">
                    Samedi et dimanche
                  </p>
                </div>
              </div>
              <Switch
                checked={filtres.disponible_weekend || false}
                onCheckedChange={(checked) => handleToggleFiltre('disponible_weekend', checked)}
              />
            </div>
          </div>

          {/* Langues parlées */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-600" />
              <Label className="font-semibold">Langues parlées</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {LANGUES_DISPONIBLES.map((langue) => (
                <Badge
                  key={langue}
                  variant="outline"
                  className={`cursor-pointer transition-all justify-center py-2 ${
                    filtres.langues?.includes(langue)
                      ? 'bg-teal-100 border-teal-500 text-teal-800'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleToggleLangue(langue)}
                >
                  {filtres.langues?.includes(langue) && (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  {langue}
                </Badge>
              ))}
            </div>
          </div>

          {/* Assurances acceptées */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <Label className="font-semibold">Assurances acceptées</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ASSURANCES_DISPONIBLES.map((assurance) => (
                <div
                  key={assurance}
                  onClick={() => handleToggleAssurance(assurance)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    filtres.assurances?.includes(assurance)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      filtres.assurances?.includes(assurance)
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-gray-300'
                    }`}>
                      {filtres.assurances?.includes(assurance) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{assurance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé des filtres actifs */}
          {nombreFiltresActifs > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Filtres actifs ({nombreFiltresActifs})
              </p>
              <div className="flex flex-wrap gap-2">
                {filtres.accepte_cmu && (
                  <Badge className="bg-green-100 text-green-800">
                    Accepte CMU
                  </Badge>
                )}
                {filtres.disponible_weekend && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Week-end
                  </Badge>
                )}
                {filtres.langues?.map((langue) => (
                  <Badge key={langue} className="bg-purple-100 text-purple-800">
                    🌐 {langue}
                  </Badge>
                ))}
                {filtres.assurances?.map((assurance) => (
                  <Badge key={assurance} className="bg-indigo-100 text-indigo-800">
                    💳 {assurance.substring(0, 20)}...
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}