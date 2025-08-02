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

const templates = [
  {
    id: 1,
    name: "Classic Model",
    preview: "/placeholder.svg",
    description: "Layout clássico com 4 fotos e informações básicas"
  },
  {
    id: 2,
    name: "Fashion Forward",
    preview: "/placeholder.svg", 
    description: "Design moderno com grid dinâmico"
  },
  {
    id: 3,
    name: "Professional",
    preview: "/placeholder.svg",
    description: "Layout executivo com destaque para headshot"
  },
  {
    id: 4,
    name: "Creative",
    preview: "/placeholder.svg",
    description: "Design criativo com elementos visuais únicos"
  }
]

export function CompositeTemplates({ talent, photos }: CompositeTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(1)
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
    const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
    
    if (!selectedTemplateData) return ''
    
    return `
      <div style="
        width: 600px; 
        height: 800px; 
        background: white; 
        padding: 20px; 
        font-family: Arial, sans-serif;
        box-sizing: border-box;
        color: black;
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">PREGIATO MANAGEMENT</h1>
          <h2 style="margin: 10px 0; font-size: 20px;">${talent.name}</h2>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          ${selectedPhotos.slice(0, 4).map(photo => `
            <div style="
              width: 100%; 
              height: 150px; 
              background-image: url('${photo}');
              background-size: cover;
              background-position: center;
              border-radius: 8px;
            ">
            </div>
          `).join('')}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3 style="color: #2563eb; margin-bottom: 10px;">Informações Pessoais</h3>
            <p><strong>Nome:</strong> ${talent.name}</p>
            <p><strong>Altura:</strong> ${talent.dna?.physicalCharacteristics?.height || 'N/A'}m</p>
            <p><strong>Medidas:</strong> ${talent.dna?.physicalCharacteristics?.bust || 'N/A'} - ${talent.dna?.physicalCharacteristics?.waist || 'N/A'} - ${talent.dna?.physicalCharacteristics?.hip || 'N/A'}</p>
            <p><strong>Calçado:</strong> ${talent.dna?.physicalCharacteristics?.shoeSize || 'N/A'}</p>
            <p><strong>Olhos:</strong> ${talent.dna?.facialCharacteristics?.eyeColor || 'N/A'}</p>
            <p><strong>Cabelo:</strong> ${talent.dna?.facialCharacteristics?.hairColor || 'N/A'}</p>
          </div>
          
          <div>
            <h3 style="color: #2563eb; margin-bottom: 10px;">Contato</h3>
            <p><strong>Agência:</strong> Pregiato Management</p>
            <p><strong>Email:</strong> ${talent.email}</p>
            <p><strong>WhatsApp:</strong> ${talent.whatsapp}</p>
            <p><strong>Telefone:</strong> ${talent.phone}</p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>www.pregiato.com.br</p>
        </div>
      </div>
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

      {/* Template Selection */}
      <div>
        <h4 className="font-medium mb-3">Selecione o Template</h4>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader className="pb-2">
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <h5 className="font-medium">{template.name}</h5>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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