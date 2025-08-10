
export const getSuperFotosMenorContractTemplate = (data: any) => {
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
        .responsible { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .payment { background: #d1ecf1; padding: 15px; margin: 20px 0; border-left: 4px solid #17a2b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CONTRATO SUPER FOTOS - MENOR DE IDADE</div>
      </div>
      
      <div class="content">
        <p>Pelo presente instrumento, celebrado em <strong>${data.cidade}/${data.uf}</strong>, 
        no dia <strong>${data.dia}</strong> de <strong>${data.mes}</strong> de <strong>${data.ano}</strong>:</p>
        
        <div class="responsible">
          <h3>RESPONSÁVEL LEGAL:</h3>
          <p><strong>Nome:</strong> ${data.nomeResponsavel}</p>
          <p><strong>CPF:</strong> ${data.cpfResponsavel}</p>
        </div>
        
        <p><strong>MODELO (MENOR):</strong> ${data.modelo.fullName}</p>
        <p><strong>DOCUMENTO:</strong> ${data.modelo.document}</p>
        <p><strong>EMAIL:</strong> ${data.modelo.email}</p>
        <p><strong>TELEFONE:</strong> ${data.modelo.phone}</p>
        
        <div class="payment">
          <h3>INFORMAÇÕES DE PAGAMENTO:</h3>
          <p><strong>Valor:</strong> R$ ${data.valorContrato}</p>
          <p><strong>Método(s):</strong> ${data.metodoPagamento.join(', ')}</p>
        </div>
        
        <p>Este contrato estabelece os termos para realização de sessão fotográfica com menor de idade, 
        com a devida autorização do responsável legal, pelo período de 
        <strong>${data.duracaoContrato || 12} meses</strong>.</p>
        
        <div class="signature">
          <p>_________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________</p>
          <p><strong>${data.nomeResponsavel}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>${data.modelo.fullName}</strong></p>
          <p>Responsável Legal&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Modelo</p>
        </div>
      </div>
    </body>
    </html>
  `
}
