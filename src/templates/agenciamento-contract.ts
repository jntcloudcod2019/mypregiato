
export const getAgenciamentoContractTemplate = (data: any) => {
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
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CONTRATO DE AGENCIAMENTO</div>
      </div>
      
      <div class="content">
        <p>Pelo presente instrumento, celebrado em <strong>${data.cidade}/${data.uf}</strong>, 
        no dia <strong>${data.dia}</strong> de <strong>${data.mes}</strong> de <strong>${data.ano}</strong>:</p>
        
        <p><strong>MODELO:</strong> ${data.modelo.fullName}</p>
        <p><strong>DOCUMENTO:</strong> ${data.modelo.document}</p>
        <p><strong>EMAIL:</strong> ${data.modelo.email}</p>
        <p><strong>TELEFONE:</strong> ${data.modelo.phone}</p>
        
        <p>Este contrato estabelece os termos de agenciamento entre as partes pelo período de 
        <strong>${data.duracaoContrato || 12} meses</strong>.</p>
        
        <div class="signature">
          <p>_________________________</p>
          <p><strong>${data.modelo.fullName}</strong></p>
          <p>Modelo</p>
        </div>
      </div>
    </body>
    </html>
  `
}
