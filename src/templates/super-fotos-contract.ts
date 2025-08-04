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
  <p>b) Manter a transparência em todos os processos, fornecendo informações claras sobre os serviços executados.</p>
  <p><strong>2. Obrigações do(a) CONTRATANTE:</strong></p>
  <p>a) Fornecer todas as informações necessárias para a execução do contrato, como dados pessoais e documentos.</p>
  <p>b) Comparecer pontualmente às sessões fotográficas agendadas.</p>
  <p>c) Efetuar os pagamentos nos prazos e condições estabelecidos neste contrato.</p>

  <h2>CLÁUSULA 3ª - PRODUÇÃO FOTOGRÁFICA</h2>
  <p>a) Equipamentos profissionais: câmeras de alta resolução e iluminação adequada.</p>
  <p>b) Equipe especializada: maquiadores e fotógrafos qualificados.</p>
  <p>c) O material fotográfico será entregue ao(à) CONTRATANTE no prazo de até 05 (cinco) dias úteis após a sessão fotográfica.</p>

  <h2>CLÁUSULA 4ª - PAGAMENTO</h2>
  <p>Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de R$ <span class="contract-field">${data.valorContrato || '0,00'}</span>, sendo:</p>
  <p>a) Método de pagamento: <span class="contract-field">${data.metodoPagamento.join(', ')}</span>.</p>
  <p>b) Em caso de pagamento via cartão de crédito, débito e PIX, o CONTRATANTE compromete-se a não solicitar chargebacks após a entrega do material, salvo em caso de descumprimento do presente contrato.</p>
  <p>c) Fica a critério da CONTRATADA a concessão de descontos e facilitação das formas de pagamento.</p>

  <h2>CLÁUSULA 5ª - DIREITO DE IMAGEM</h2>
  <p>O CONTRATANTE cede à CONTRATADA o direito de uso das imagens obtidas nas sessões fotográficas para os seguintes fins:</p>
  <p>a) Divulgação junto a empresas parceiras.</p>
  <p>b) Uso nacional e internacional conforme a legislação vigente.</p>

  <h2>CLÁUSULA 6ª - ACEITAÇÃO E IRREVOGABILIDADE</h2>
  <p>a) As partes declaram ciência plena do contrato.</p>
  <p>b) O CONTRATANTE declara estar ciente de que os materiais são personalizados e exclusivos.</p>
  <p>c) O material será entregue em pen drive, testado na presença do CONTRATANTE.</p>
  <p>d) Não serão aceitos cancelamentos após a entrega, salvo vício ou defeito comprovado.</p>

  <h2>CLÁUSULA 7ª a 10ª</h2>
  <p>[Demais cláusulas mantidas conforme modelo anterior]</p>

  <!-- Assinaturas -->
  <div class="signature-section">
    <!-- Contratante -->
    <div class="digital-signature-contratante">
      <div class="signature-name">${data.modelo.fullName}</div>
      <div class="signature-details">SIGNATÁRIO</div>
    </div>

    <!-- Super Fotos -->
    <div class="digital-signature-contratante">
      <div class="signature-name">Super Fotos Fotografias Ltda</div>
      <div class="signature-details">SIGNATÁRIO</div>
      <img src="data:image/png;base64,INSIRA_O_BASE64_DA_IMAGEM" alt="Assinatura Digital Super Fotos" class="company-signature-img" />
    </div>
  </div>

</body>
</html>