import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { UserService, OperatorUser, PagedResult } from '../../services/user-service';

interface OperatorsListProps {
  className?: string;
  onAllocateLeads: (operatorId: string) => void;
  getOperatorLeadsCount: (operatorId: string) => number;
  onViewOperatorLeads: (operatorId: string) => void;
  selectedLeadsCount: number;
}

export const OperatorsList: React.FC<OperatorsListProps> = ({ 
  className, 
  onAllocateLeads, 
  getOperatorLeadsCount, 
  onViewOperatorLeads, 
  selectedLeadsCount 
}) => {
  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize] = useState(20);

  // Carregar operadores
  const loadOperators = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const result: PagedResult<OperatorUser> = await UserService.getOperators(page, pageSize, search);
      setOperators(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      setCurrentPage(result.page);
    } catch (error) {
      console.error('Erro ao carregar operadores:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Carregar operadores na montagem do componente
  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  // Buscar operadores
  const handleSearch = () => {
    setCurrentPage(1);
    loadOperators(1, searchTerm);
  };

  // Limpar busca
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadOperators(1, '');
  };

  // Mudar página
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadOperators(page, searchTerm);
    }
  };

  // Gerar iniciais para avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Operadores</CardTitle>
            <Badge variant="secondary">{totalCount}</Badge>
          </div>
          
          {/* Busca */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar operadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-64"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSearch}
              disabled={loading}
            >
              <Search className="h-4 w-4" />
            </Button>
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSearch}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : operators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Nenhum operador encontrado para esta busca.' : 'Nenhum operador disponível.'}
          </div>
        ) : (
          <>
            {/* Lista de operadores */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border-r border-gray-200">
              {operators.map((operator) => (
                <div
                  key={operator.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={operator.imageUrl} alt={`${operator.firstName} ${operator.lastName}`} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(operator.firstName, operator.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Informações do operador */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {operator.firstName} {operator.lastName}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {operator.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {operator.email}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    {getOperatorLeadsCount(operator.id) > 0 ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewOperatorLeads(operator.id)}
                        className="text-xs"
                      >
                        {getOperatorLeadsCount(operator.id)} Lead{getOperatorLeadsCount(operator.id) !== 1 ? 's' : ''}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={selectedLeadsCount === 0}
                        onClick={() => onAllocateLeads(operator.id)}
                        className="text-xs"
                      >
                        {selectedLeadsCount > 0 ? `Alocar ${selectedLeadsCount} Lead${selectedLeadsCount !== 1 ? 's' : ''}` : 'Sem leads selecionados'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} operadores
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
