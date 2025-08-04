
export const getComprometimentoContractTemplate = (data: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .content { margin: 20px 0; }
        .signature { margin-top: 50px; text-align: center; }
        .objective { background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CONTRATO DE COMPROMETIMENTO</div>
      </div>
      
      <div class="content">
        <p>Pelo presente instrumento, celebrado em <strong>${data.cidade}/${data.uf}</strong>, 
        no dia <strong>${data.dia}</strong> de <strong>${data.mes}</strong> de <strong>${data.ano}</strong>:</p>
        
        <p><strong>MODELO:</strong> ${data.modelo.fullName}</p>
        <p><strong>DOCUMENTO:</strong> ${data.modelo.document}</p>
        <p><strong>EMAIL:</strong> ${data.modelo.email}</p>
        <p><strong>TELEFONE:</strong> ${data.modelo.phone}</p>
        
        <div class="objective">
          <h3>OBJETIVO DO CONTRATO:</h3>
          <p>${data.objetivoContrato || 'Não especificado'}</p>
        </div>
        
        ${data.observacoes ? `
          <div class="objective">
            <h3>OBSERVAÇÕES:</h3>
            <p>${data.observacoes}</p>
          </div>
        ` : ''}
        
        <p>Este contrato estabelece o comprometimento entre as partes pelo período de 
        <strong>${data.duracaoContrato || 12} meses</strong>.</p>
        
        <div class="signature">
          <p>_________________________</p>
          <p><strong>${data.modelo.fullName}</strong></p>
          <p>Modelo</p>
        </div>
      </div>
    </body>
    </body>
  `
}
