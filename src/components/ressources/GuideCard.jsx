import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

const CATEGORIE_COLORS = {
  sommeil: 'bg-indigo-100 text-indigo-800',
  alimentation: 'bg-green-100 text-green-800',
  premiers_soins: 'bg-red-100 text-red-800',
  developpement: 'bg-purple-100 text-purple-800',
  sante: 'bg-blue-100 text-blue-800',
  hygiene: 'bg-cyan-100 text-cyan-800',
  securite: 'bg-orange-100 text-orange-800',
  education: 'bg-amber-100 text-amber-800',
  grossesse: 'bg-pink-100 text-pink-800',
  post_partum: 'bg-rose-100 text-rose-800',
};

const CATEGORIE_LABELS = {
  sommeil: 'Sommeil',
  alimentation: 'Alimentation',
  premiers_soins: 'Premiers soins',
  developpement: 'Développement',
  sante: 'Santé',
  hygiene: 'Hygiène',
  securite: 'Sécurité',
  education: 'Éducation',
  grossesse: 'Grossesse',
  post_partum: 'Post-partum',
};

export default function GuideCard({ guide, onDownload, onPreview }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-16 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className={`${CATEGORIE_COLORS[guide.categorie]} text-xs mb-2`}>
              {CATEGORIE_LABELS[guide.categorie]}
            </Badge>
            <h3 className="font-semibold text-sm line-clamp-2">{guide.titre}</h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{guide.description}</p>
            
            <div className="flex items-center gap-2 mt-3">
              {guide.url && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={(e) => { e.stopPropagation(); onPreview?.(guide); }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Aperçu
                  </Button>
                  <Button 
                    size="sm"
                    className="h-8 text-xs bg-pink-500 hover:bg-pink-600"
                    onClick={(e) => { e.stopPropagation(); onDownload?.(guide); }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Télécharger
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}