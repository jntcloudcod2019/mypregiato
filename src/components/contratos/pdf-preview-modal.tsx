
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Send, Trash2 } from "lucide-react"

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
            <DialogTitle className="text-lg font-semibold">
              Pré-visualização do Contrato - {contractName}
            </DialogTitle>
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
              disabled={isSending || isLoading}
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
                  Enviar
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
              Excluir
            </Button>
          </div>
        </div>

        {/* Visualização do PDF */}
        <div className="flex-1 overflow-hidden">
          {pdfBase64 && pdfUrl ? (
            <div className="h-[70vh] w-full">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`Pré-visualização - ${contractName}`}
                onLoad={() => console.log('[PDF_PREVIEW] Iframe carregado')}
                onError={(e) => console.error('[PDF_PREVIEW] Erro no iframe:', e)}
              />
            </div>
          ) : (
            <div className="h-[70vh] w-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando pré-visualização do PDF...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
