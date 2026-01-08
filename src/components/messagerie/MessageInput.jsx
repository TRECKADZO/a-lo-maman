import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Send, Paperclip, Loader2, File, X } from 'lucide-react';

export default function MessageInput({ onMessageSend, disabled = false }) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleAttachmentSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limiter la taille à 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier doit être inférieur à 10 MB');
      return;
    }

    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setAttachment({
        uri: file_uri,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (error) {
      alert('Erreur lors du téléchargement: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !attachment) return;

    setSending(true);
    try {
      await onMessageSend({
        content: message.trim(),
        attachment_uri: attachment?.uri,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
      });
      
      setMessage('');
      setAttachment(null);
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !uploading && !sending) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
      {/* Aperçu du fichier joint */}
      {attachment && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
              {attachment.name}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="flex-shrink-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input et boutons */}
      <div className="flex gap-2 items-end">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          title="Joindre un fichier"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleAttachmentSelect}
          className="hidden"
          disabled={uploading}
        />

        <Input
          placeholder="Écrire votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || disabled}
          className="flex-1 resize-none"
        />

        <Button
          onClick={handleSend}
          disabled={sending || disabled || (!message.trim() && !attachment) || uploading}
          className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
        Max. 10 MB | Entrée pour envoyer, Maj+Entrée pour nouvelle ligne
      </p>
    </div>
  );
}