import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, CheckCircle, Clock, RefreshCw, Eye } from 'lucide-react';
import { trainingService } from '@/services/training-service';
import { useToast } from '@/hooks/use-toast';
import { TrainingEnrollment } from '@/types/training';

interface CertificateDownloadProps {
  enrollment: TrainingEnrollment;
  onCertificateGenerated?: () => void;
  className?: string;
}

export const CertificateDownload: React.FC<CertificateDownloadProps> = ({
  enrollment,
  onCertificateGenerated,
  className,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGenerateCertificate = async () => {
    if (!enrollment.id) return;

    setIsGenerating(true);
    try {
      // Gerar e baixar certificado diretamente
      const pdfBlob = await trainingService.generateCertificate({
        userEmail: 'usuario@exemplo.com', // TODO: Obter do contexto de autenticação
        courseId: enrollment.course?.id || enrollment.courseId || '', // Usar o ID do curso
        completionDate: enrollment.completedAt || new Date()
      });

      // Criar URL do blob e fazer download automaticamente
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado_${enrollment.course?.title || 'Curso'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Certificado gerado!',
        description: 'Seu certificado foi criado e o download foi iniciado.',
      });

      onCertificateGenerated?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao gerar certificado.';
      toast({
        title: 'Erro ao gerar certificado',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!enrollment.certificateId) return;

    setIsDownloading(true);
    try {
      // Fazer download direto do certificado
      const response = await fetch(`/api/TrainingCertificates/${enrollment.certificateId}/download`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar certificado');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${enrollment.course?.title || 'curso'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download iniciado!',
        description: 'O certificado está sendo baixado.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar certificado',
        description: 'Não foi possível baixar o certificado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewCertificate = () => {
    if (!enrollment.certificateId) return;
    // Abrir o certificado em nova aba para visualização
    window.open(`/api/TrainingCertificates/${enrollment.certificateId}/download`, '_blank');
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isCompleted = enrollment.completedAt != null;
  const hasCertificate = enrollment.certificateIssued && enrollment.certificateId;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Certificado de Conclusão
        </CardTitle>
        <CardDescription>
          {isCompleted 
            ? 'Parabéns! Você concluiu o curso com sucesso.'
            : 'Complete o curso para gerar seu certificado.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do curso */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {isCompleted ? 'Curso Concluído' : 'Em Andamento'}
            </span>
          </div>
          
          {isCompleted && (
            <Badge variant={hasCertificate ? 'default' : 'secondary'}>
              {hasCertificate ? 'Certificado Disponível' : 'Pendente de Geração'}
            </Badge>
          )}
        </div>

        {/* Informações do curso */}
        {enrollment.course && (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Curso:</span>
              <p className="font-semibold">{enrollment.course.title}</p>
            </div>
            
            {isCompleted && (
              <div>
                <span className="text-sm font-medium text-gray-600">Data de Conclusão:</span>
                <p>{formatDate(enrollment.completedAt)}</p>
              </div>
            )}

            {hasCertificate && enrollment.certificateIssuedAt && (
              <div>
                <span className="text-sm font-medium text-gray-600">Certificado Emitido:</span>
                <p>{formatDate(enrollment.certificateIssuedAt)}</p>
              </div>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2 pt-4">
          {isCompleted ? (
            <>
              {hasCertificate ? (
                <>
                  <Button
                    onClick={handleDownloadCertificate}
                    disabled={isDownloading}
                    className="flex-1"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Certificado
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handlePreviewCertificate}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGenerateCertificate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Certificado...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Certificado
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button disabled variant="outline" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Complete o curso para gerar certificado
            </Button>
          )}
        </div>

        {/* Informações adicionais */}
        {hasCertificate && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Seu certificado está pronto para download!
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              O certificado contém um código de validação único para verificação.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateDownload;
