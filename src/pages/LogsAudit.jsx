import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Shield, Search, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ACTION_LABELS = {
  read: 'Lecture',
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  export: 'Export',
  share: 'Partage'
};

const ACTION_COLORS = {
  read: 'bg-blue-100 text-blue-800',
  create: 'bg-green-100 text-green-800',
  update: 'bg-orange-100 text-orange-800',
  delete: 'bg-red-100 text-red-800',
  export: 'bg-purple-100 text-purple-800',
  share: 'bg-pink-100 text-pink-800'
};

export default function LogsAudit() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('tous');
  const [filterEntity, setFilterEntity] = useState('tous');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      return await base44.entities.AuditLog.list('-timestamp', 1000);
    },
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription>
            Accès réservé aux administrateurs
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrage
  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!log.user_email?.toLowerCase().includes(query) && 
          !log.entity_id?.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filterAction !== 'tous' && log.action !== filterAction) return false;
    if (filterEntity !== 'tous' && log.entity_type !== filterEntity) return false;
    return true;
  });

  // Pagination
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  // Entités uniques pour le filtre
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Logs d'audit
          </h1>
          <p className="text-gray-600 mt-1">Traçabilité des accès aux données sensibles</p>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <CardTitle className="text-base">Filtres</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par email ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les actions</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les entités</SelectItem>
                  {uniqueEntities.map(entity => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total actions</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Utilisateurs uniques</p>
              <p className="text-2xl font-bold">{new Set(logs.map(l => l.user_email)).size}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Dernières 24h</p>
              <p className="text-2xl font-bold">
                {logs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 86400000)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Entités touchées</p>
              <p className="text-2xl font-bold">{uniqueEntities.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des logs */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : paginatedLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun log trouvé</p>
            ) : (
              <div className="space-y-2">
                {paginatedLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={ACTION_COLORS[log.action]}>
                            {ACTION_LABELS[log.action]}
                          </Badge>
                          <Badge variant="outline">{log.entity_type}</Badge>
                          <span className="text-sm text-gray-600">{log.user_email}</span>
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Entity ID: {log.entity_id || 'N/A'}</p>
                          <p>IP: {log.ip_address || 'unknown'}</p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <p>Détails: {JSON.stringify(log.details)}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {format(new Date(log.timestamp || log.created_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
}