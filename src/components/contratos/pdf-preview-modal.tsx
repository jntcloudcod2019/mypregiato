
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Send, Trash2, Download } from "lucide-react"

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

  const handleDownload = () => {
    if (!pdfBase64) return
    
    try {
      const byteCharacters = atob(pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${contractName}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
    }
  }

  console.log('[PDF_PREVIEW] Modal aberto:', isOpen)
  console.log('[PDF_PREVIEW] PDF Base64 length:', pdfBase64?.length || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Contrato Gerado - {contractName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            O contrato foi gerado com sucesso. Escolha uma ação:
          </DialogDescription>
        </DialogHeader>
        
        {/* Informações do arquivo */}
        <div className="py-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{contractName}</p>
                <p className="text-sm text-muted-foreground">
                  Tamanho: {pdfBase64 ? ((pdfBase64.length * 3) / (4 * 1024)).toFixed(0) : '0'} KB
                </p>
              </div>
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleDownload}
            disabled={isLoading || !pdfBase64}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={isSending || isLoading || !pdfBase64}
            className="bg-green-600 hover:bg-green-700 text-white w-full"
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
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
