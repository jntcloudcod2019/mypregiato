import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Download, Share, Eye, X } from "lucide-react"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CompositeTemplatesProps {
  talent: any
  photos: string[]
}

export function CompositeTemplates({ talent, photos }: CompositeTemplatesProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handlePhotoSelection = (photo: string, checked: boolean) => {
    if (checked) {
      if (selectedPhotos.length < 4) {
        setSelectedPhotos([...selectedPhotos, photo])
      }
    } else {
      setSelectedPhotos(selectedPhotos.filter(p => p !== photo))
    }
  }

  const generateComposite = async () => {
    if (selectedPhotos.length === 0) return
    
    setIsGenerating(true)
    
    try {
      // Create composite content
      const compositeElement = document.createElement('div')
      compositeElement.innerHTML = getCompositeHTML()
      compositeElement.style.width = '800px'
      compositeElement.style.height = '1000px'
      compositeElement.style.position = 'absolute'
      compositeElement.style.left = '-9999px'
      compositeElement.style.top = '-9999px'
      document.body.appendChild(compositeElement)

      const canvas = await html2canvas(compositeElement, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      
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

      pdf.save(`composite-${talent.fullName?.replace(/\s+/g, '-').toLowerCase() || 'modelo'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      if (document.body.contains(compositeElement)) {
        document.body.removeChild(compositeElement)
      }
      setIsGenerating(false)
    }
  }

  const shareViaWhatsApp = async () => {
    if (selectedPhotos.length === 0) return
    
    setIsGenerating(true)
    
    try {
      // Generate composite and convert to base64
      const compositeElement = document.createElement('div')
      compositeElement.innerHTML = getCompositeHTML()
      compositeElement.style.width = '800px'
      compositeElement.style.height = '1000px'
      compositeElement.style.position = 'absolute'
      compositeElement.style.left = '-9999px'
      compositeElement.style.top = '-9999px'
      document.body.appendChild(compositeElement)

      const canvas = await html2canvas(compositeElement, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // Para desenvolvimento: abrir WhatsApp Web com mensagem
      const message = `Composite do talento ${talent.fullName || 'Modelo'} - Pregiato Management`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error)
    } finally {
      if (document.body.contains(compositeElement)) {
        document.body.removeChild(compositeElement)
      }
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
              /* Importar fonte Bebas Neue */
              @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
              
              /* Reset Básico */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }

              body {
                  font-family: Arial, sans-serif;
                  background-color: #000000; /* Fundo preto conforme especificação */
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  padding: 0;
              }

              .composite-container {
                  width: 100%;
                  max-width: 800px;
                  background-color: #000000; /* Fundo preto */
                  color: #ffffff;
                  display: flex;
                  flex-direction: column; /* Layout vertical com header */
                  min-height: 100vh;
              }

              /* Header com logo centralizado */
              .header-section {
                  width: 100%;
                  background-color: #000000;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  padding: 20px;
                  border-bottom: 2px solid #333;
              }

              .logo-header {
                  width: 200px;
                  height: 60px;
                  background-image: url('data:image/svg+xml;base64,${getLogoBase64()}');
                  background-size: contain;
                  background-repeat: no-repeat;
                  background-position: center;
              }

              /* Seção principal com fotos */
              .photos-section {
                  flex: 1;
                  padding: 40px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
              }

              .photos-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  grid-template-rows: 1fr 1fr;
                  gap: 20px;
                  width: 100%;
                  max-width: 500px;
              }

              .photo-container {
                  aspect-ratio: 1;
                  background-color: #111;
                  border-radius: 8px;
                  overflow: hidden;
                  border: 2px solid #333;
                  background-size: cover;
                  background-position: center;
                  background-repeat: no-repeat;
              }

              .model-info {
                  margin-top: 30px;
                  text-align: center;
                  color: #ffffff;
              }

              .model-name {
                  font-family: 'Bebas Neue', Arial, sans-serif;
                  font-size: 32px;
                  font-weight: 400;
                  margin-bottom: 10px;
                  color: #ffffff;
                  letter-spacing: 2px;
                  text-transform: uppercase;
              }

              .model-details {
                  font-size: 14px;
                  color: #cccccc;
                  line-height: 1.4;
              }

              .model-details p {
                  margin: 2px 0;
              }

              /* Responsividade */
              @media (max-width: 600px) {
                  .composite-container {
                      flex-direction: column;
                  }
                  
                  .header-section {
                      padding: 15px;
                  }
                  
                  .logo-header {
                      width: 150px;
                      height: 45px;
                  }
                  
                  .photos-section {
                      padding: 20px;
                  }
                  
                  .photos-grid {
                      gap: 15px;
                  }
                  
                  .model-name {
                      font-size: 24px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="composite-container">
              <!-- Header com logo centralizado -->
              <div class="header-section">
                  <div class="logo-header"></div>
              </div>

              <!-- Seção principal com fotos -->
              <div class="photos-section">
                  <div class="photos-grid">
                      <div class="photo-container" style="background-image: url('${selectedPhotos[0] || ''}');">
                          ${!selectedPhotos[0] ? '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Foto 1</div>' : ''}
                      </div>
                      <div class="photo-container" style="background-image: url('${selectedPhotos[1] || ''}');">
                          ${!selectedPhotos[1] ? '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Foto 2</div>' : ''}
                      </div>
                      <div class="photo-container" style="background-image: url('${selectedPhotos[2] || ''}');">
                          ${!selectedPhotos[2] ? '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Foto 3</div>' : ''}
                      </div>
                      <div class="photo-container" style="background-image: url('${selectedPhotos[3] || ''}');">
                          ${!selectedPhotos[3] ? '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Foto 4</div>' : ''}
                      </div>
                  </div>

                  <!-- Informações do modelo -->
                  <div class="model-info">
                      <div class="model-name">${talent.fullName || 'Nome do Modelo'}</div>
                      <div class="model-details">
                          ${talent.dna?.height ? `<p>Altura: ${talent.dna.height}m</p>` : ''}
                          ${talent.dna?.weight ? `<p>Peso: ${talent.dna.weight}kg</p>` : ''}
                          ${talent.dna?.chestSize ? `<p>Busto: ${talent.dna.chestSize}cm</p>` : ''}
                          ${talent.dna?.waistSize ? `<p>Cintura: ${talent.dna.waistSize}cm</p>` : ''}
                          ${talent.dna?.hipSize ? `<p>Quadril: ${talent.dna.hipSize}cm</p>` : ''}
                          ${talent.dna?.shoeSize ? `<p>Calçado: ${talent.dna.shoeSize}</p>` : ''}
                          ${talent.dna?.dressSize ? `<p>Manequim: ${talent.dna.dressSize}</p>` : ''}
                      </div>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  }

  // Função para obter o logo em base64
  const getLogoBase64 = () => {
    // Logo SVG do Pregiato em base64
    const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="100" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="300" height="100" fill="#1a1a2e" rx="8"/>
  
  <!-- PREGIATO Text -->
  <text x="150" y="45" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
        text-anchor="middle" fill="url(#logoGradient)" 
        transform="skewX(-5)" letter-spacing="2px">
    PREGIATO
  </text>
  
  <!-- Line -->
  <line x1="50" y1="55" x2="250" y2="55" stroke="#888" stroke-width="1"/>
  
  <!-- MANAGEMENT Text -->
  <text x="150" y="75" font-family="Arial, sans-serif" font-size="12" font-weight="normal" 
        text-anchor="middle" fill="#888" letter-spacing="3px">
    MANAGEMENT
  </text>
</svg>`
    
    return btoa(unescape(encodeURIComponent(logoSvg)))
  }

  const generatePreview = () => {
    setShowPreview(true)
  }

  return (
    <div className="space-y-6">
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-6xl max-h-[90vh] overflow-auto relative">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">Preview do Composite</h3>
              <p className="text-sm text-muted-foreground">Clique no X para fechar</p>
            </div>
            <div 
              className="w-[800px] h-[1000px] bg-black text-white border border-gray-600 rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: getCompositeHTML() }}
            />
          </div>
        </div>
      )}

      {/* Photo Selection */}
      <div>
        <h4 className="font-medium mb-3">Selecione 4 Fotos para o Composite</h4>
        <div className="grid grid-cols-4 gap-3">
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
        {selectedPhotos.length < 4 && (
          <p className="text-xs text-amber-600 mt-1">
            Selecione exatamente 4 fotos para gerar o composite
          </p>
        )}
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
          disabled={selectedPhotos.length !== 4}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        
        <Button 
          onClick={generateComposite}
          disabled={selectedPhotos.length !== 4 || isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Gerando...' : 'Salvar PDF'}
        </Button>
        
        <Button 
          onClick={shareViaWhatsApp}
          disabled={selectedPhotos.length !== 4 || isGenerating}
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