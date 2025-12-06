import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Save, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Briefcase,
  Building2,
  Phone,
  Video
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

export default function GestionTarifs({ professionnel, onClose }) {
  const queryClient = useQueryClient();
  
  const [tarifs, setTarifs] = useState({
    tarif_consultation: professionnel?.tarif_consultation || 0,
    tarifs_par_type: professionnel?.tarifs_par_type || {
      cabinet: 0,
      clinique: 0,
      hopital: 0,
      telephone: 0,
      visio: 0,
    },
    accepte_cmu: professionnel?.accepte_cmu !== false,
    assurances_acceptees: professionnel?.assurances_acceptees || [],
  });

  const [nouvelleAssurance, setNouvelleAssurance] = useState('');

  const assurancesCommunes = [
    'NSIA Assurance',
    'Saham Assurance',
    'Allianz Côte d\'Ivoire',
    'Sunu Assurances',
    'Activa Assurance',
    'SONAR',
    'AGF Assurances',
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!professionnel || !professionnel.id) {
        throw new Error('Profil professionnel introuvable');
      }
      
      return await base44.entities.Professionnel.update(professionnel.id, tarifs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      alert('✅ Tarifs mis à jour avec succès !');
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
      alert('❌ Une erreur est survenue lors de la sauvegarde.');
    }
  });

  const ajouterAssurance = () => {
    if (nouvelleAssurance.trim() && !tarifs.assurances_acceptees.includes(nouvelleAssurance.trim())) {
      setTarifs({
        ...tarifs,
        assurances_acceptees: [...tarifs.assurances_acceptees, nouvelleAssurance.trim()]
      });
      setNouvelleAssurance('');
    }
  };

  const retirerAssurance = (assurance) => {
    setTarifs({
      ...tarifs,
      assurances_acceptees: tarifs.assurances_acceptees.filter(a => a !== assurance)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        <Card className="shadow-2xl border-none">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                Gérer mes tarifs et paiements
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Info CMU */}
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Couverture Maladie Universelle (CMU)</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• La CMU prend en charge 100% des consultations chez les professionnels agréés</li>
                  <li>• Accepter la CMU vous permet d'atteindre plus de patients</li>
                  <li>• Les paiements CMU sont garantis par l'État ivoirien</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Tarifs par type de consultation */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Tarifs par type de consultation</h3>
                  <p className="text-sm text-gray-600">Définissez vos tarifs pour chaque type de consultation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cabinet */}
                <div className="space-y-2 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <Label className="font-semibold">Cabinet</Label>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={tarifs.tarifs_par_type.cabinet}
                      onChange={(e) => setTarifs({ 
                        ...tarifs, 
                        tarifs_par_type: { ...tarifs.tarifs_par_type, cabinet: parseFloat(e.target.value) || 0 }
                      })}
                      className="pl-12"
                      placeholder="0"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      FCFA
                    </div>
                  </div>
                </div>

                {/* Clinique */}
                <div className="space-y-2 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <Label className="font-semibold">Clinique</Label>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={tarifs.tarifs_par_type.clinique}
                      onChange={(e) => setTarifs({ 
                        ...tarifs, 
                        tarifs_par_type: { ...tarifs.tarifs_par_type, clinique: parseFloat(e.target.value) || 0 }
                      })}
                      className="pl-12"
                      placeholder="0"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      FCFA
                    </div>
                  </div>
                </div>

                {/* Hôpital */}
                <div className="space-y-2 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-600" />
                    <Label className="font-semibold">Hôpital</Label>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={tarifs.tarifs_par_type.hopital}
                      onChange={(e) => setTarifs({ 
                        ...tarifs, 
                        tarifs_par_type: { ...tarifs.tarifs_par_type, hopital: parseFloat(e.target.value) || 0 }
                      })}
                      className="pl-12"
                      placeholder="0"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      FCFA
                    </div>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-2 p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <Label className="font-semibold">Téléphone</Label>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={tarifs.tarifs_par_type.telephone}
                      onChange={(e) => setTarifs({ 
                        ...tarifs, 
                        tarifs_par_type: { ...tarifs.tarifs_par_type, telephone: parseFloat(e.target.value) || 0 }
                      })}
                      className="pl-12"
                      placeholder="0"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      FCFA
                    </div>
                  </div>
                </div>

                {/* Vidéoconsultation */}
                <div className="space-y-2 p-3 bg-white rounded-lg border md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-teal-600" />
                    <Label className="font-semibold">Vidéoconsultation</Label>
                  </div>
                  <div className="relative max-w-md">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={tarifs.tarifs_par_type.visio}
                      onChange={(e) => setTarifs({ 
                        ...tarifs, 
                        tarifs_par_type: { ...tarifs.tarifs_par_type, visio: parseFloat(e.target.value) || 0 }
                      })}
                      className="pl-12"
                      placeholder="0"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      FCFA
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  💡 <strong>Conseil :</strong> Les tarifs peuvent varier selon le type de consultation. Par exemple, les consultations à domicile ou à l'hôpital peuvent être plus élevées que celles au cabinet.
                </AlertDescription>
              </Alert>
            </div>

            {/* Acceptation CMU */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Accepter la CMU</h3>
                    <p className="text-sm text-gray-600">Couverture Maladie Universelle</p>
                  </div>
                </div>
                <Switch
                  checked={tarifs.accepte_cmu}
                  onCheckedChange={(checked) => setTarifs({ ...tarifs, accepte_cmu: checked })}
                />
              </div>

              {tarifs.accepte_cmu && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">Vous acceptez la CMU</p>
                      <p>Vos patients bénéficiant de la CMU pourront consulter gratuitement. Les paiements vous seront versés directement par la CMU.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Assurances acceptées */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Assurances acceptées</h3>
                  <p className="text-sm text-gray-600">Compagnies d'assurance avec lesquelles vous travaillez</p>
                </div>
              </div>

              {/* Liste des assurances actuelles */}
              {tarifs.assurances_acceptees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tarifs.assurances_acceptees.map((assurance, index) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800 flex items-center gap-2 px-3 py-1">
                      {assurance}
                      <button
                        onClick={() => retirerAssurance(assurance)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggestions d'assurances */}
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Assurances courantes en Côte d'Ivoire</Label>
                <div className="flex flex-wrap gap-2">
                  {assurancesCommunes.filter(a => !tarifs.assurances_acceptees.includes(a)).map((assurance, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => setTarifs({
                        ...tarifs,
                        assurances_acceptees: [...tarifs.assurances_acceptees, assurance]
                      })}
                    >
                      + {assurance}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ajouter une assurance personnalisée */}
              <div className="space-y-2">
                <Label className="text-xs">Ajouter une autre assurance</Label>
                <div className="flex gap-2">
                  <Input
                    value={nouvelleAssurance}
                    onChange={(e) => setNouvelleAssurance(e.target.value)}
                    placeholder="Nom de l'assurance"
                    onKeyPress={(e) => e.key === 'Enter' && ajouterAssurance()}
                    className="bg-white"
                  />
                  <Button type="button" onClick={ajouterAssurance} variant="outline">
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Récapitulatif
              </h4>
              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold text-teal-900">Tarifs par type :</p>
                  {tarifs.tarifs_par_type.cabinet > 0 && (
                    <div className="flex justify-between pl-4">
                      <span className="text-gray-600">• Cabinet</span>
                      <span className="font-semibold text-gray-900">{tarifs.tarifs_par_type.cabinet.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {tarifs.tarifs_par_type.clinique > 0 && (
                    <div className="flex justify-between pl-4">
                      <span className="text-gray-600">• Clinique</span>
                      <span className="font-semibold text-gray-900">{tarifs.tarifs_par_type.clinique.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {tarifs.tarifs_par_type.hopital > 0 && (
                    <div className="flex justify-between pl-4">
                      <span className="text-gray-600">• Hôpital</span>
                      <span className="font-semibold text-gray-900">{tarifs.tarifs_par_type.hopital.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {tarifs.tarifs_par_type.telephone > 0 && (
                    <div className="flex justify-between pl-4">
                      <span className="text-gray-600">• Téléphone</span>
                      <span className="font-semibold text-gray-900">{tarifs.tarifs_par_type.telephone.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  {tarifs.tarifs_par_type.visio > 0 && (
                    <div className="flex justify-between pl-4">
                      <span className="text-gray-600">• Vidéoconsultation</span>
                      <span className="font-semibold text-gray-900">{tarifs.tarifs_par_type.visio.toLocaleString()} FCFA</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">CMU acceptée</span>
                  <span className="font-semibold">
                    {tarifs.accepte_cmu ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Oui
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Non
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assurances</span>
                  <span className="font-semibold">{tarifs.assurances_acceptees.length} compagnie(s)</span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 border-gray-300"
              >
                Annuler
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 shadow-md"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}