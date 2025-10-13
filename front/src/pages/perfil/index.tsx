import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthPermissions } from '@/hooks/use-auth-permissions';
import { useToast } from '@/hooks/use-toast';
import { TalentData } from '@/types/talent';
import apiClient from '@/services/api-client';

interface ProfileStatus {
  exists: boolean;
  talent?: TalentData;
  loading: boolean;
  error?: string;
}

const PerfilPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isModel } = useAuthPermissions();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    exists: false,
    loading: true
  });

  // Verificar se é um usuário MODEL
  useEffect(() => {
    if (!isModel) {
      toast({
        title: "Acesso negado",
        description: "Esta página é exclusiva para usuários MODEL.",
        variant: "destructive"
      });
      navigate('/treinamentos');
      return;
    }
  }, [isModel, navigate, toast]);

  // Verificar se o talent existe
  useEffect(() => {
    const checkTalentExists = async () => {
      if (!user?.email || !isModel) return;

      try {
        setProfileStatus(prev => ({ ...prev, loading: true }));
        
        console.log('[Perfil] Verificando se talent existe para email:', user.email);
        
        // Buscar talent por email
        const response = await apiClient.get<TalentData[]>(`/api/Talents?email=${encodeURIComponent(user.email)}`);
        
        if (response.data && response.data.length > 0) {
          const talent = response.data[0];
          console.log('[Perfil] Talento encontrado:', talent);
          setProfileStatus({
            exists: true,
            talent,
            loading: false
          });
        } else {
          console.log('[Perfil] Talento não encontrado, permitindo criação');
          setProfileStatus({
            exists: false,
            loading: false
          });
        }
      } catch (error: any) {
        console.error('[Perfil] Erro ao verificar talent:', error);
        setProfileStatus({
          exists: false,
          loading: false,
          error: error.message || 'Erro ao verificar perfil'
        });
      }
    };

    checkTalentExists();
  }, [user?.email, isModel]);

  const handleCreateProfile = () => {
    // Redirecionar para página de criação de talento
    // Passar dados do usuário autenticado como parâmetros
    const params = new URLSearchParams({
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      isModelProfile: 'true' // Flag para indicar que é criação de perfil próprio
    });
    
    navigate(`/talentos/novo?${params.toString()}`);
  };

  const handleViewProfile = () => {
    if (profileStatus.talent) {
      navigate(`/talentos/perfil/${profileStatus.talent.id}`);
    }
  };

  const handleEditProfile = () => {
    if (profileStatus.talent) {
      navigate(`/talentos/perfil/${profileStatus.talent.id}`);
    }
  };

  if (!isModel) {
    return null; // Não renderizar nada se não for MODEL
  }

  if (profileStatus.loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Verificando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileStatus.error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {profileStatus.error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-1">
            {profileStatus.exists 
              ? 'Gerencie suas informações de talento' 
              : 'Crie seu perfil de talento para começar'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Status do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileStatus.exists ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">
                      Perfil Completo
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Seu perfil de talento está ativo e completo
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <span className="text-sm font-medium">{profileStatus.talent?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium">{profileStatus.talent?.email || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`text-sm font-medium ${profileStatus.talent?.status ? 'text-green-600' : 'text-orange-600'}`}>
                      {profileStatus.talent?.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">DNA:</span>
                    <span className="text-sm font-medium">
                      {profileStatus.talent?.dnaStatus === 'COMPLETE' ? 'Completo' : 
                       profileStatus.talent?.dnaStatus === 'PARTIAL' ? 'Parcial' : 'Pendente'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleViewProfile} className="flex-1">
                    Ver Perfil Completo
                  </Button>
                  <Button variant="outline" onClick={handleEditProfile}>
                    Editar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      Perfil Não Encontrado
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Você ainda não possui um perfil de talento cadastrado
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Próximos passos:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Preencha suas informações pessoais</li>
                    <li>• Adicione suas fotos profissionais</li>
                    <li>• Complete seu DNA (características físicas)</li>
                    <li>• Torne-se visível para oportunidades</li>
                  </ul>
                </div>

                <Button onClick={handleCreateProfile} className="w-full" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Meu Perfil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nome:</span>
                <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo de Usuário:</span>
                <span className="text-sm font-medium">{user?.role}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Recursos Disponíveis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Acesso aos treinamentos</li>
                <li>✓ Gerenciamento do perfil</li>
                <li>✓ Visualização de oportunidades</li>
                <li>✓ Certificados de conclusão</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerfilPage;
