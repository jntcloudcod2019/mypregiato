export const getContractTemplate = (data: any) => {
  return `
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contrato de Prestação de Serviços Fotográficos</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      margin: 20px;
      color: #000000;
      background-color: #ffffff;
    }

    h1 {
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 20px;
    }

    h2 {
      font-size: 14px;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    p {
      margin: 5px 0;
      text-align: justify;
    }

    .contract-field {
      font-weight: bold;
      color: #000000;
    }

    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }

    .digital-signature-contratante {
      background-color: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 4px;
      padding: 10px;
      margin: 10px auto;
      text-align: left;
      width: 300px;
      font-size: 11px;
    }

    .digital-signature-contratante .signature-name {
      color: #1976d2;
      font-weight: bold;
      margin-bottom: 2px;
    }

    .digital-signature-contratante .signature-details {
      color: #666;
      font-size: 9px;
    }

    .company-signature-img {
      width: 300px;
      height: auto;
      display: block;
      margin: 10px auto;
      object-fit: contain;
      border: 1px solid #ccc;
      padding: 5px;
      background-color: #f9f9f9;
    }
  </style>
</head>
<body>

  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS</h1>

  <p>${data.cidade} - ${data.uf}, ${data.dia} de ${data.mes} de ${data.ano}.</p>

  <p>Pelo presente instrumento particular de contrato, as partes abaixo qualificadas, a saber:</p>

  <h2>CONTRATANTE:</h2>
  <p><span class="contract-field">${data.modelo.fullName}</span>, inscrito(a) no CPF: <span class="contract-field">${data.modelo.document}</span>, residente e domiciliada no endereço <span class="contract-field">${data.modelo.street}</span>, nº <span class="contract-field">${data.modelo.numberAddress || 'S/N'}</span>, <span class="contract-field">${data.modelo.complement || ''}</span>, localizado no bairro <span class="contract-field">${data.modelo.neighborhood}</span>, situado na cidade <span class="contract-field">${data.modelo.city}</span> - <span class="contract-field">${data.uf}</span> CEP: <span class="contract-field">${data.modelo.postalcode}</span>, tendo como telefone principal: <span class="contract-field">${data.modelo.phone}</span> e telefone secundário: <span class="contract-field">${data.modelo.phone}</span>.</p>

  <h2>CONTRATADA:</h2>
  <p>SUPER FOTOS FOTOGRAFIAS LTDA, inscrita no CNPJ sob o nº 13.310.215/0001-50, com sede na Avenida Paulista, nº 1636 – salas 1105/1324 – Cerqueira Cesar – São Paulo – SP – CEP: 01310-200, representada por quem de direito via cartão CNPJ.</p>

  <h2>CLÁUSULA 1ª - OBJETO DO CONTRATO</h2>
  <p>A CONTRATADA compromete-se a prestar serviços de produção de material fotográfico, incluindo:</p>
  <p>a) Produção fotográfica: realização de ensaios fotográficos conforme especificado pelas partes.</p>
  <p>b) Edição de fotos: tratamento e aprimoramento das imagens capturadas.</p>

  <h2>CLÁUSULA 2ª - DAS OBRIGAÇÕES DAS PARTES</h2>
  <p><strong>1. Obrigações da CONTRATADA:</strong></p>
  <p>a) Disponibilizar estúdio equipado, equipe especializada e realizar a entrega do material nos prazos acordados.</p>
  <p>b) Garantir a qualidade técnica e artística dos serviços prestados.</p>
  <p>c) Respeitar os prazos estabelecidos para entrega do material.</p>
  <p>d) Manter sigilo profissional sobre o conteúdo das sessões.</p>

  <p><strong>2. Obrigações da CONTRATANTE:</strong></p>
  <p>a) Fornecer informações corretas e completas sobre suas expectativas.</p>
  <p>b) Comparecer nos horários agendados para as sessões fotográficas.</p>
  <p>c) Respeitar as orientações técnicas fornecidas pela equipe.</p>
  <p>d) Realizar o pagamento conforme acordado.</p>

  <h2>CLÁUSULA 3ª - VALOR E FORMA DE PAGAMENTO</h2>
  <p>O valor total dos serviços contratados é de <span class="contract-field">R$ ${data.valorContrato}</span> (${data.valorPorExtenso}), a ser pago da seguinte forma:</p>
  <p>${data.metodoPagamento.map((metodo: string) => `- ${metodo}`).join('<br>')}</p>

  <h2>CLÁUSULA 4ª - PRAZO E ENTREGA</h2>
  <p>O prazo para entrega do material será de até <span class="contract-field">${data.prazoEntrega || '30'} dias</span> após a realização da sessão fotográfica.</p>

  <h2>CLÁUSULA 5ª - DIREITOS AUTORAIS</h2>
  <p>Os direitos autorais das fotografias pertencem à CONTRATADA, que poderá utilizá-las para fins promocionais, desde que não haja prejuízo à imagem da CONTRATANTE.</p>

  <h2>CLÁUSULA 6ª - RESCISÃO</h2>
  <p>O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de 48 horas, sem prejuízo das obrigações já assumidas.</p>

  <h2>CLÁUSULA 7ª - FORO</h2>
  <p>As partes elegem o foro da comarca de <span class="contract-field">${data.cidade}</span> para dirimir quaisquer dúvidas ou litígios decorrentes do presente contrato.</p>

  <div class="signature-section">
    <p>E por estar de acordo com todas as cláusulas e condições estabelecidas, as partes assinam o presente contrato.</p>
    
    <p><span class="contract-field">${data.cidade}</span>, ${data.dia} de ${data.mes} de ${data.ano}.</p>
    
    <div style="display: flex; justify-content: space-between; margin-top: 50px;">
      <div style="text-align: center; width: 45%;">
        <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 10px;"></div>
        <p style="font-weight: bold; margin: 0;">${data.modelo.fullName}</p>
        <p style="font-size: 12px; margin: 0;">CONTRATANTE</p>
        <p style="font-size: 10px; margin: 5px 0;">CPF: ${data.modelo.document}</p>
      </div>
      
      <div style="text-align: center; width: 45%;">
        <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 10px;"></div>
        <p style="font-weight: bold; margin: 0;">SUPER FOTOS FOTOGRAFIAS LTDA</p>
        <p style="font-size: 12px; margin: 0;">CONTRATADA</p>
        <p style="font-size: 10px; margin: 5px 0;">CNPJ: 13.310.215/0001-50</p>
      </div>
    </div>
  </div>

</body>
</html>
  `
} 