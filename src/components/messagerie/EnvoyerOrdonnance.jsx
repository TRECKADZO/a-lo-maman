import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Pill, Upload, Loader2, Send, Plus, Trash2 } from 'lucide-react';

export default function EnvoyerOrdonnance({ patientEmail, conversationId, onClose }) {
  const queryClient = useQueryClient();
  const [medicaments, setMedicaments] = useState([{ nom: '', posologie: '', duree: '' }]);
  const [instructions, setInstructions] = useState('');
  const [fichierOrdonnance, setFichierOrdonnance] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const ajouterMedicament = () => {
    setMedicaments([...medicaments, { nom: '', posologie: '', duree: '' }]);
  };

  const supprimerMedicament = (index) => {
    setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  const updateMedicament = (index, field, value) => {
    const newMedicaments = [...medicaments];
    newMedicaments[index][field] = value;
    setMedicaments(newMedicaments);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setFichierOrdonnance({ uri: file_uri, nom: file.name });
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors du téléchargement du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  const envoyerOrdonnanceMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      // Construire le contenu du message
      let contenuMessage = '💊 ORDONNANCE MÉDICALE\n\n';
      
      if (medicaments.some(m => m.nom)) {
        contenuMessage += '📋 Médicaments prescrits :\n\n';
        medicaments.forEach((med, index) => {
          if (med.nom) {
            contenuMessage += `${index + 1}. ${med.nom}\n`;
            if (med.posologie) contenuMessage += `   💊 Posologie : ${med.posologie}\n`;
            if (med.duree) contenuMessage += `   ⏱️ Durée : ${med.duree}\n`;
            contenuMessage += '\n';
          }
        });
      }

      if (instructions) {
        contenuMessage += `📝 Instructions :\n${instructions}\n\n`;
      }

      contenuMessage += '⚠️ Veuillez suivre scrupuleusement cette ordonnance. En cas de doute, contactez-moi.';

      // Envoyer le message avec ou sans fichier
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        content: contenuMessage,
        attachment_uri: fichierOrdonnance?.uri || null,
        attachment_name: fichierOrdonnance?.nom || null,
        attachment_type: 'application/pdf',
        file_category: 'ordonnance',
        is_read: false
      });

      await base44.entities.Conversation.update(conversationId, {
        last_message_content: '💊 Ordonnance médicale envoyée',
        last_message_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const hasMedicaments = medicaments.some(m => m.nom.trim());
    if (!hasMedicaments && !fichierOrdonnance) {
      alert('Veuillez ajouter au moins un médicament ou joindre une ordonnance');
      return;
    }
    
    envoyerOrdonnanceMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-600" />
              Envoyer une ordonnance
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Patient : <span className="font-semibold">{patientEmail}</span>
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Liste des médicaments */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Médicaments prescrits</Label>
                <Button
                  type="button"
                  onClick={ajouterMedicament}
                  size="sm"
                  variant="outline"
                  className="bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {medicaments.map((med, index) => (
                <Card key={index} className="p-4 bg-gray-50 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Médicament {index + 1}</span>
                      {medicaments.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => supprimerMedicament(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`nom-${index}`} className="text-sm">Nom du médicament *</Label>
                      <Input
                        id={`nom-${index}`}
                        value={med.nom}
                        onChange={(e) => updateMedicament(index, 'nom', e.target.value)}
                        placeholder="Ex: Paracétamol 500mg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`posologie-${index}`} className="text-sm">Posologie</Label>
                        <Input
                          id={`posologie-${index}`}
                          value={med.posologie}
                          onChange={(e) => updateMedicament(index, 'posologie', e.target.value)}
                          placeholder="Ex: 1 comprimé 3x/jour"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`duree-${index}`} className="text-sm">Durée</Label>
                        <Input
                          id={`duree-${index}`}
                          value={med.duree}
                          onChange={(e) => updateMedicament(index, 'duree', e.target.value)}
                          placeholder="Ex: 7 jours"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Instructions générales */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions complémentaires</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Conseils d'utilisation, précautions particulières..."
                rows={4}
              />
            </div>

            {/* Upload ordonnance scannée */}
            <div className="space-y-2">
              <Label>Joindre une ordonnance scannée (optionnel)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                {fichierOrdonnance ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Pill className="w-5 h-5" />
                      <span className="font-medium">{fichierOrdonnance.nom}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setFichierOrdonnance(null)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Téléchargement...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Cliquez pour télécharger une ordonnance scannée
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, JPG ou PNG (max 10 MB)
                          </p>
                        </>
                      )}
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={envoyerOrdonnanceMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={envoyerOrdonnanceMutation.isPending || isUploading}
              >
                {envoyerOrdonnanceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer l'ordonnance
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}