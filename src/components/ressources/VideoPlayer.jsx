import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Clock, Share2, ExternalLink } from 'lucide-react';

export default function VideoPlayer({ video, onClose }) {
  // Extraire l'ID YouTube si c'est une URL YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(video.url);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-white truncate flex-1">{video.titre}</h1>
      </div>

      {/* Video */}
      <div className="aspect-video bg-black">
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={video.titre}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : video.url ? (
          <video 
            src={video.url} 
            controls 
            autoPlay
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Vidéo non disponible
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white p-4 space-y-4">
        <h2 className="text-lg font-bold">{video.titre}</h2>
        
        <div className="flex flex-wrap gap-2">
          {video.duree_minutes && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {video.duree_minutes} min
            </Badge>
          )}
          {video.categorie && (
            <Badge className="bg-pink-100 text-pink-800">{video.categorie}</Badge>
          )}
        </div>

        {video.auteur?.nom && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {video.auteur.photo_url ? (
              <img src={video.auteur.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-pink-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{video.auteur.nom}</p>
              {video.auteur.titre && (
                <p className="text-xs text-gray-500">{video.auteur.titre}</p>
              )}
            </div>
          </div>
        )}

        <p className="text-gray-700">{video.description}</p>

        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          {video.url && (
            <Button 
              variant="outline"
              onClick={() => window.open(video.url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}