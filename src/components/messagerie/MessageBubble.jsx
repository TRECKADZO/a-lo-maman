import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { File, Download, Loader2, CheckCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function MessageBubble({ message, isOwn, senderName }) {
  const [signingUrl, setSigningUrl] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Générer l'URL signée pour télécharger le fichier
  const handleDownloadAttachment = async () => {
    if (!message.attachment_uri) return;
    
    setSigningUrl(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: message.attachment_uri,
        expires_in: 3600,
      });
      setDownloadUrl(signed_url);
      
      // Télécharger automatiquement
      const link = document.createElement('a');
      link.href = signed_url;
      link.download = message.attachment_name || 'fichier';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setSigningUrl(false);
    }
  };

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Message texte */}
        {message.content && (
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? 'bg-pink-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
            }`}
          >
            <p className="text-sm break-words">{message.content}</p>
          </div>
        )}

        {/* Fichier joint */}
        {message.attachment_uri && (
          <div
            className={`mt-2 p-3 rounded-lg border ${
              isOwn
                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.attachment_name}</p>
              </div>
              <button
                onClick={handleDownloadAttachment}
                disabled={signingUrl}
                className="flex-shrink-0 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Télécharger"
              >
                {signingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Timestamp et statut */}
        <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'justify-end text-pink-600 dark:text-pink-400' : 'text-gray-600 dark:text-gray-400'}`}>
          <span>
            {format(new Date(message.created_date), 'HH:mm', { locale: fr })}
          </span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )
          )}
        </div>
      </div>

      {/* Avatar sender (non-owner) */}
      {!isOwn && (
        <div className="order-2 flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
          {senderName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}