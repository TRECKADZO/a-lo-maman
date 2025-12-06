import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Star, 
  Share2, 
  Calendar,
  User,
  Baby,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DocumentCard({ document, typeInfo, enfants, onClick }) {
  const IconComponent = typeInfo?.icon || FileText;
  
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
      amber: 'bg-amber-100 text-amber-600 border-amber-200',
      teal: 'bg-teal-100 text-teal-600 border-teal-200',
      rose: 'bg-rose-100 text-rose-600 border-rose-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200',
      slate: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return colors[color] || colors.blue;
  };

  const getMemberInfo = () => {
    if (document.membre_type === 'maman') {
      return { icon: User, label: 'Moi', color: 'pink' };
    } else if (document.membre_type === 'famille') {
      return { icon: Users, label: 'Famille', color: 'green' };
    } else if (document.enfant_id) {
      const enfant = enfants?.find(e => e.id === document.enfant_id);
      return { icon: Baby, label: enfant?.prenom || 'Enfant', color: 'blue' };
    }
    return { icon: User, label: 'Inconnu', color: 'gray' };
  };

  const memberInfo = getMemberInfo();
  const MemberIcon = memberInfo.icon;

  return (
    <Card 
      className="shadow-lg border-none rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getColorClasses(typeInfo?.color)}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{document.titre}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {document.favori && (
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                )}
                {document.partages?.length > 0 && (
                  <Share2 className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            {/* Type badge */}
            <Badge variant="outline" className={`mb-2 ${getColorClasses(typeInfo?.color)}`}>
              {typeInfo?.label || 'Document'}
            </Badge>

            {/* Member */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MemberIcon className="w-4 h-4" />
              <span>{memberInfo.label}</span>
            </div>

            {/* Date */}
            {document.date_document && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(document.date_document), 'dd MMM yyyy', { locale: fr })}</span>
              </div>
            )}

            {/* Professionnel */}
            {document.professionnel && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {document.professionnel}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}