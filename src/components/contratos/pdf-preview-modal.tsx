
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Send, Trash2, AlertCircle, RefreshCw } from "lucide-react"

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfBase64: string
  contractName: string
  onSend: () => Promise<void>
  onDelete: () => void
  isLoading?: boolean
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfBase64,
  contractName,
  onSend,
  onDelete,
  isLoading = false
}: PDFPreviewModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleSend = async () => {
    setIsSending(true)
    try {
      await onSend()
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  const handleRetryPdf = () => {
    setPdfError(false)
    setRetryCount(prev => prev + 1)
  }

  // Criar URL do PDF de forma mais robusta
  const pdfUrl = pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : ''

  console.log('[PDF_PREVIEW] Modal aberto:', isOpen)
  console.log('[PDF_PREVIEW] PDF Base64 length:', pdfBase64?.length || 0)
  console.log('[PDF_PREVIEW] PDF URL criada:', pdfUrl ? 'Sim' : 'Não')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Pré-visualização do Contrato - {contractName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Revise o contrato antes de enviar via WhatsApp
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {/* Botões de Ação */}
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleSend}
              disabled={isSending || isLoading || !pdfBase64}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                </>
              )}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSending || isLoading}
              variant="destructive"
              className="px-6"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>

        {/* Visualização do PDF */}
        <div className="flex-1 overflow-hidden">
          {!pdfBase64 ? (
            <div className="h-[70vh] w-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando pré-visualização do PDF...</p>
              </div>
            </div>
          ) : pdfError ? (
            <div className="h-[70vh] w-full flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erro ao carregar PDF
                </h3>
                <p className="text-gray-600 mb-4">
                  Não foi possível exibir a pré-visualização do PDF. Você ainda pode enviar o contrato.
                </p>
                <Button
                  onClick={handleRetryPdf}
                  variant="outline"
                  className="mr-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[70vh] w-full">
              <iframe
                key={`pdf-${retryCount}`}
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`Pré-visualização - ${contractName}`}
                onLoad={() => {
                  console.log('[PDF_PREVIEW] Iframe carregado com sucesso')
                  setPdfError(false)
                }}
                onError={(e) => {
                  console.error('[PDF_PREVIEW] Erro no iframe:', e)
                  setPdfError(true)
                }}
              />
            </div>
          )}
        </div>

        {pdfBase64 && (
          <div className="px-6 py-2 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              Tamanho do arquivo: {((pdfBase64.length * 3) / (4 * 1024)).toFixed(0)} KB
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
