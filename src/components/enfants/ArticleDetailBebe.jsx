import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User, Share2, Heart, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ArticleDetailBebe({ article, onBack }) {
  if (!article) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header natif */}
      <div 
        className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b flex items-center gap-3 px-4 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 truncate flex-1">{article.titre}</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 active:scale-95 transition-transform">
          <Heart className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Contenu scrollable */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Image hero */}
        {article.image_url && (
          <div className="relative h-56 bg-gradient-to-br from-pink-100 to-purple-100">
            <img 
              src={article.image_url} 
              alt={article.titre}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* Contenu */}
        <div className="p-5 pb-10">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-pink-100 text-pink-800 font-medium">
              {article.categorie?.replace('_', ' ')}
            </Badge>
            {article.temps_lecture && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.temps_lecture} min
              </Badge>
            )}
            {article.valide_par_expert && (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Vérifié
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {article.titre}
          </h1>

          {/* Résumé */}
          {article.resume && (
            <p className="text-gray-600 text-base mb-6 leading-relaxed">
              {article.resume}
            </p>
          )}

          {/* Auteur */}
          {article.auteur?.nom && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl mb-6">
              {article.auteur.photo_url ? (
                <img 
                  src={article.auteur.photo_url} 
                  alt={article.auteur.nom}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{article.auteur.nom}</p>
                {article.auteur.specialite && (
                  <p className="text-sm text-gray-500">{article.auteur.specialite}</p>
                )}
              </div>
            </div>
          )}

          {/* Contenu markdown */}
          <div className="prose prose-pink max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700">
            <ReactMarkdown>{article.contenu || "Contenu à venir..."}</ReactMarkdown>
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-500 mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="rounded-full">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer natif avec safe area */}
      <div 
        className="flex-shrink-0 bg-white border-t p-4 flex gap-3"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
          <Heart className="w-5 h-5" />
          Sauvegarder
        </button>
        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform">
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </motion.div>
  );
}