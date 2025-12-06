import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  X,
  Download,
  Share2,
  Star,
  Archive,
  Trash2,
  Loader2,
  FileText,
  Calendar,
  User,
  Building,
  Tag,
  Users,
  Baby,
  Eye,
  Send,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';

export default function DetailDocument({ document, enfants, onClose }) {
  const queryClient = useQueryClient();
  const [showPartage, setShowPartage] = useState(false);
  const [partageEmail, setPartageEmail] = useState('');
  const [partageNom, setPartageNom] = useState('');
  const [partageType, setPartageType] = useState('professionnel');
  const [partageExpire, setPartageExpire] = useState('');
  const [permissions, setPermissions] = useState(['lecture']);
  const [downloading, setDownloading] = useState(false);

  // Fetch professionnels for quick share
  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels_partage'],
    queryFn: () => base44.entities.Professionnel.list(),
  });

  // Toggle favori
  const toggleFavoriMutation = useMutation({
    mutationFn: () => base44.entities.DocumentFamille.update(document.id, { favori: !document.favori }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents_famille'] }),
  });

  // Toggle archive
  const toggleArchiveMutation = useMutation({
    mutationFn: () => base44.entities.DocumentFamille.update(document.id, { archive: !document.archive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_famille'] });
      onClose();
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.DocumentFamille.delete(document.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_famille'] });
      onClose();
    },
  });

  // Partager
  const partageMutation = useMutation({
    mutationFn: async () => {
      const partagesActuels = document.partages || [];
      const nouveauPartage = {
        email: partageEmail,
        nom: partageNom,
        type: partageType,
        permissions,
        date_partage: new Date().toISOString(),
        expire_le: partageExpire || null,
      };
      
      await base44.entities.DocumentFamille.update(document.id, {
        partages: [...partagesActuels, nouveauPartage]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_famille'] });
      setShowPartage(false);
      setPartageEmail('');
      setPartageNom('');
      setPermissions(['lecture']);
    },
  });

  // Révoquer partage
  const revoquerPartageMutation = useMutation({
    mutationFn: async (email) => {
      const partagesActuels = document.partages || [];
      await base44.entities.DocumentFamille.update(document.id, {
        partages: partagesActuels.filter(p => p.email !== email)
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents_famille'] }),
  });

  // Télécharger
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: document.file_uri,
        expires_in: 3600
      });
      window.open(signed_url, '_blank');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
      deleteMutation.mutate();
    }
  };

  const togglePermission = (perm) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
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
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={document.titre}
      fullHeight
    >
      <div className="p-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        <div className="space-y-4">
          {/* Actions principales */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Télécharger
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPartage(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleFavoriMutation.mutate()}
            >
              <Star className={`w-4 h-4 mr-2 ${document.favori ? 'fill-amber-500 text-amber-500' : ''}`} />
              {document.favori ? 'Retirer favori' : 'Favori'}
            </Button>
          </div>

          {/* Infos document */}
          <Card className="shadow-lg">
            <CardContent className="p-4 space-y-4">
              {/* Type */}
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium">{document.type_document?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {/* Membre */}
              <div className="flex items-center gap-3">
                <MemberIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Membre</p>
                  <p className="font-medium">{memberInfo.label}</p>
                </div>
              </div>

              {/* Date */}
              {document.date_document && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date du document</p>
                    <p className="font-medium">{format(new Date(document.date_document), 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                </div>
              )}

              {/* Professionnel */}
              {document.professionnel && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Professionnel</p>
                    <p className="font-medium">{document.professionnel}</p>
                  </div>
                </div>
              )}

              {/* Établissement */}
              {document.etablissement && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Établissement</p>
                    <p className="font-medium">{document.etablissement}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {document.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{document.description}</p>
                </div>
              )}

              {/* Mots-clés */}
              {document.mots_cles?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Mots-clés</p>
                  <div className="flex flex-wrap gap-2">
                    {document.mots_cles.map((mc, i) => (
                      <Badge key={i} variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {mc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partages actifs */}
          {document.partages?.length > 0 && (
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Partagé avec ({document.partages.length})
                </h3>
                <div className="space-y-3">
                  {document.partages.map((partage, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">{partage.nom || partage.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {partage.type === 'professionnel' ? 'Pro' : 'Famille'}
                          </Badge>
                          {partage.permissions?.map(p => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p === 'lecture' && <Eye className="w-3 h-3 mr-1" />}
                              {p === 'telechargement' && <Download className="w-3 h-3 mr-1" />}
                              {p}
                            </Badge>
                          ))}
                          {partage.expire_le && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expire: {format(new Date(partage.expire_le), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revoquerPartageMutation.mutate(partage.email)}
                        disabled={revoquerPartageMutation.isPending}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions secondaires */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => toggleArchiveMutation.mutate()}
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-2" />
              {document.archive ? 'Désarchiver' : 'Archiver'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Modal Partage */}
        {showPartage && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
            <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Partager ce document</h3>
                <button onClick={() => setShowPartage(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Partage rapide avec pro */}
                {professionnels.length > 0 && (
                  <div>
                    <Label>Partage rapide avec un professionnel</Label>
                    <Select
                      onValueChange={(value) => {
                        const pro = professionnels.find(p => p.email === value);
                        if (pro) {
                          setPartageEmail(pro.email);
                          setPartageNom(pro.nom_complet);
                          setPartageType('professionnel');
                        }
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner un professionnel" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionnels.map(pro => (
                          <SelectItem key={pro.id} value={pro.email}>
                            {pro.nom_complet} - {pro.specialite}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="text-center text-gray-400 text-sm">ou</div>

                {/* Partage manuel */}
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={partageEmail}
                    onChange={(e) => setPartageEmail(e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>

                <div>
                  <Label>Nom (optionnel)</Label>
                  <Input
                    value={partageNom}
                    onChange={(e) => setPartageNom(e.target.value)}
                    placeholder="Nom de la personne"
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select value={partageType} onValueChange={setPartageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professionnel">Professionnel de santé</SelectItem>
                      <SelectItem value="famille">Membre de la famille</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={permissions.includes('lecture')}
                        onCheckedChange={() => togglePermission('lecture')}
                      />
                      <span className="text-sm">Lecture (visualiser)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={permissions.includes('telechargement')}
                        onCheckedChange={() => togglePermission('telechargement')}
                      />
                      <span className="text-sm">Téléchargement</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Date d'expiration (optionnel)</Label>
                  <Input
                    type="date"
                    value={partageExpire}
                    onChange={(e) => setPartageExpire(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPartage(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => partageMutation.mutate()}
                    disabled={partageMutation.isPending || !partageEmail}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {partageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Partager
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}