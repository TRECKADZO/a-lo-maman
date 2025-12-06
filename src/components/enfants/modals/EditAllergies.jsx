import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X, Loader2, Plus } from 'lucide-react';

export default function EditAllergies({ enfant, onClose }) {
  const queryClient = useQueryClient();
  const [allergies, setAllergies] = useState(enfant.allergies || []);
  const [newAllergy, setNewAllergy] = useState('');

  const mutation = useMutation({
    mutationFn: (updatedAllergies) => base44.entities.EnfantCarnet.update(enfant.id, { allergies: updatedAllergies }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_patient', enfant.id] });
      onClose();
    },
  });

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };
  
  const handleRemoveAllergy = (allergyToRemove) => {
    setAllergies(allergies.filter(a => a !== allergyToRemove));
  };

  const handleSubmit = () => {
    mutation.mutate(allergies);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gérer les allergies</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={mutation.isPending}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Input 
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Ajouter une allergie..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                />
                <Button type="button" onClick={handleAddAllergy}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
            </div>
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Allergies enregistrées :</p>
                {allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {allergies.map(allergy => (
                            <Badge key={allergy} variant="destructive" className="text-base">
                                {allergy}
                                <button onClick={() => handleRemoveAllergy(allergy)} className="ml-2 p-0.5 rounded-full hover:bg-white/20">
                                    <X className="w-3 h-3"/>
                                </button>
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">Aucune allergie enregistrée.</p>
                )}
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer les modifications'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}