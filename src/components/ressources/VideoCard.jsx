import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, User } from 'lucide-react';

export default function VideoCard({ video, onClick }) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] overflow-hidden"
      onClick={onClick}
    >
      <div className="relative">
        {video.image_url ? (
          <img 
            src={video.image_url} 
            alt={video.titre}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Play className="w-12 h-12 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-pink-600 ml-1" />
          </div>
        </div>
        {video.duree_minutes && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {video.duree_minutes} min
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.titre}</h3>
        {video.auteur?.nom && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="w-3 h-3" />
            {video.auteur.nom}
          </div>
        )}
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{video.description}</p>
      </CardContent>
    </Card>
  );
}