import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Download, Share, Eye, X } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CompositeTemplatesProps {
  talent: any
  photos: string[]
}

// Template fixo - removemos a seleção de templates
const fixedTemplate = {
  id: 1,
  name: "Layout Pregiato",
  description: "4 fotos em grade 2x2",
  columns: 2,
  photoCount: 4,
  preview: "🖼️ 2x2"
}

export function CompositeTemplates({ talent, photos }: CompositeTemplatesProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handlePhotoSelection = (photo: string, checked: boolean) => {
    if (checked) {
      setSelectedPhotos([...selectedPhotos, photo])
    } else {
      setSelectedPhotos(selectedPhotos.filter(p => p !== photo))
    }
  }

  const generateComposite = async () => {
    setIsGenerating(true)
    
    // Create composite content
    const compositeElement = document.createElement('div')
    compositeElement.innerHTML = getCompositeHTML()
    compositeElement.style.width = '600px'
    compositeElement.style.height = '800px'
    compositeElement.style.position = 'absolute'
    compositeElement.style.left = '-9999px'
    document.body.appendChild(compositeElement)

    try {
      const canvas = await html2canvas(compositeElement)
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`composite-${talent.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      document.body.removeChild(compositeElement)
      setIsGenerating(false)
    }
  }

  const shareViaWhatsApp = async () => {
    setIsGenerating(true)
    
    // Generate composite and convert to base64
    const compositeElement = document.createElement('div')
    compositeElement.innerHTML = getCompositeHTML()
    compositeElement.style.width = '600px'
    compositeElement.style.height = '800px'
    compositeElement.style.position = 'absolute'
    compositeElement.style.left = '-9999px'
    document.body.appendChild(compositeElement)

    try {
      const canvas = await html2canvas(compositeElement)
      const imgData = canvas.toDataURL('image/png')
      
      // Convert to base64 for API
      const base64Data = imgData.split(',')[1]
      
      // API call to send via WhatsApp
      /*
      await fetch('/api/whatsapp/send-composite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64Data,
          talentName: talent.name,
          // Adicione outros parâmetros necessários para sua API
        })
      })
      */
      
      console.log('Composite shared via WhatsApp:', { talentName: talent.name, base64Length: base64Data.length })
      // Para desenvolvimento: abrir WhatsApp Web com mensagem
      const message = `Composite do talento ${talent.name} - Pregiato Management`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error)
    } finally {
      document.body.removeChild(compositeElement)
      setIsGenerating(false)
    }
  }

  const getCompositeHTML = () => {
    if (selectedPhotos.length === 0) return ''
    
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pregiato Composite</title>
          <style>
              /* Reset Básico */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }

              body {
                  font-family: Arial, sans-serif;
                  background-color: #004e7c; /* Cor de fundo azul do logo */
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  padding: 20px;
              }

              .composite-container {
                  width: 100%;
                  max-width: 800px; /* Ajuste o tamanho máximo conforme necessário */
                  background-color: white;
                  border-radius: 15px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
              }

              .composite-header {
                  height: 80px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  padding: 20px;
              }

              .composite-main {
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  gap: 20px;
              }

              .composite-row {
                  display: flex;
                  justify-content: space-between;
                  gap: 20px;
              }

              .composite-photo-placeholder {
                  width: 50%;
                  height: 350px; /* Ajuste a altura das fotos */
                  background-color: #e0e0e0;
                  border-radius: 10px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  color: #a0a0a0;
                  font-weight: bold;
                  font-size: 1.2em;
                  border: 2px solid #ccc; /* Borda para demarcar a área */
                  background-size: cover;
                  background-position: center;
                  background-repeat: no-repeat;
              }

              .composite-footer {
                  padding: 20px;
                  text-align: center;
                  color: #555;
                  font-size: 0.9em;
                  border-top: 1px solid #eee;
              }

              /* Responsividade básica */
              @media (max-width: 600px) {
                  .composite-row {
                      flex-direction: column;
                  }

                  .composite-photo-placeholder {
                      width: 100%;
                  }
              }
          </style>
      </head>
      <body>
          <div class="composite-container">
              <header class="composite-header">
                  <img src="/src/assets/pregiato-logo.png" alt="Pregiato Logo" style="max-height: 40px;">
              </header>

              <div class="composite-main">
                  <div class="composite-row">
                      <div class="composite-photo-placeholder" style="background-image: url('${selectedPhotos[0] || ''}');">
                          ${!selectedPhotos[0] ? 'Foto 1' : ''}
                      </div>
                      <div class="composite-photo-placeholder" style="background-image: url('${selectedPhotos[1] || ''}');">
                          ${!selectedPhotos[1] ? 'Foto 2' : ''}
                      </div>
                  </div>

                  <div class="composite-row">
                      <div class="composite-photo-placeholder" style="background-image: url('${selectedPhotos[2] || ''}');">
                          ${!selectedPhotos[2] ? 'Foto 3' : ''}
                      </div>
                      <div class="composite-photo-placeholder" style="background-image: url('${selectedPhotos[3] || ''}');">
                          ${!selectedPhotos[3] ? 'Foto 4' : ''}
                      </div>
                  </div>
              </div>

              <footer class="composite-footer">
                  ${talent.name || 'Nome do Talento'}
              </footer>
          </div>
      </body>
      </html>
    `
  }

  const generatePreview = () => {
    setShowPreview(true)
  }

  return (
    <div className="space-y-6">
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <div 
              className="w-[600px] h-[800px] bg-white text-black p-5 rounded-lg shadow-2xl"
              dangerouslySetInnerHTML={{ __html: getCompositeHTML() }}
            />
          </div>
        </div>
      )}

      {/* Template fixo - removido a seleção */}

      {/* Photo Selection */}
      <div>
        <h4 className="font-medium mb-3">Selecione as Fotos (máximo 4)</h4>
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img 
                  src={photo} 
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-2 right-2">
                <Checkbox
                  checked={selectedPhotos.includes(photo)}
                  onCheckedChange={(checked) => handlePhotoSelection(photo, checked as boolean)}
                  disabled={selectedPhotos.length >= 4 && !selectedPhotos.includes(photo)}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selectedPhotos.length}/4 fotos selecionadas
        </p>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gerando composite...</span>
            <span className="text-sm text-muted-foreground">75%</span>
          </div>
          <Progress value={75} className="w-full" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        <Button 
          onClick={generatePreview}
          disabled={selectedPhotos.length === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        
        <Button 
          onClick={generateComposite}
          disabled={selectedPhotos.length === 0 || isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Gerando...' : 'Salvar PDF'}
        </Button>
        
        <Button 
          onClick={shareViaWhatsApp}
          disabled={selectedPhotos.length === 0 || isGenerating}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Share className="h-4 w-4" />
          WhatsApp
        </Button>
      </div>
    </div>
  )
}