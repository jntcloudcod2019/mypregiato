
export const getContractTemplate = (data: any) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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

.signature {
margin: 30px 0;
text-align: center;
font-weight: bold;
position: relative;
width: 100%;
max-width: 400px;
margin-left: auto;
margin-right: auto;
}

.signature p {
margin: 8px 0;
font-size: 14px;
}

.signature-line {
display: block;
width: 300px;
border-bottom: 2px solid black;
margin: 15px auto;
padding-top: 15px;
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

.digital-signature-contratante .signature-icon {
color: #1976d2;
font-weight: bold;
margin-right: 5px;
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

.company-signature {
text-align: center;
margin: 30px auto;
width: 400px;
}

.company-title {
font-size: 16px;
font-weight: bold;
margin-bottom: 15px;
text-transform: uppercase;
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

.signature-line-simple {
margin: 20px 0;
text-align: left;
font-size: 12px;
}

.signature-underline {
display: inline-block;
width: 200px;
border-bottom: 1px solid #000;
margin-left: 10px;
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
<p>As obrigações das partes no presente contrato estão definidas conforme os seguintes termos e em conformidade com o Código Civil Brasileiro e o Código de Defesa do Consumidor (Lei nº 8.078/1990):</p>
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
<p>b) Em caso de pagamento via cartão de crédito, débito e PIX, o CONTRATANTE compromete-se a não solicitar chargebacks (processo de estorno de um valor pago junto as bandeiras de cartão) após a entrega do material, salvo em caso do descumprimento do presente contrato.</p>
<p>c) Fica a critério da CONTRATADA a concessão de descontos e facilitação das formas de pagamento de acordo com sua discricionariedade.</p>

<h2>CLÁUSULA 5ª - DIREITO DE IMAGEM</h2>
<p>O CONTRATANTE cede à CONTRATADA, o direito de uso das imagens obtidas nas sessões fotográficas realizadas, para os seguintes fins:</p>
<p>a) Divulgação junto a empresas parceiras da CONTRATADA.</p>
<p>b) O presente instrumento concede a autorização de uso de imagem em todo território nacional e internacional, em todas as modalidades de uso, desde que respeitadas a legislação estabelecida no território de onde será utilizada a imagem, sem trazer nenhum prejuízo moral ou penal ao cedente.</p>

<h2>CLÁUSULA 6ª - ACEITAÇÃO E IRREVOGABILIDADE</h2>
<p>a) As partes declaram que celebram o presente contrato em comum acordo, com plena ciência de seus direitos e deveres.</p>
<p>b) O CONTRATANTE declara estar ciente que os materiais produzidos são personalizados e exclusivos.</p>
<p>c) Após a entrega dos materiais, o CONTRATANTE confirma sua aceitação dos serviços e produtos fornecidos.</p>
<p>d) O material fotográfico será entregue de forma digital em dispositivo de armazenamento portátil (pen drive).</p>
<p>e) No ato da entrega do material fotográfico, a CONTRATADA irá realizar testes na presença do CONTRATANTE a fim verificar a capacidade de reconhecimento do dispositivo e materiais fotográficos ali presentes.</p>
<p>f) O CONTRATANTE não se responsabiliza por danos causados por mau uso posterior ao teste realizado no ato da entrega.</p>
<p>g) Não será permitido cancelamento, devolução ou reembolso dos valores pagos, salvo em caso de vícios ou defeitos comprovados.</p>

<h2>CLÁUSULA 7ª - DA ISENÇÃO DAS AGÊNCIAS DE MODELOS</h2>
<p>a) O CONTRATANTE declara estar ciente de que a contratação dos serviços da EMPRESA é independente do agenciamento realizado pela agência de modelos.</p>
<p>b) Nenhuma agência de modelo presente no evento possui qualquer responsabilidade, seja ela SOLIDARIA e OU SUBSIDIÁRIA pelo objeto presente neste instrumento.</p>

<h2>CLÁUSULA 8ª - EXCLUSIVIDADE</h2>
<p>a) Este contrato não estabelece exclusividade entre as partes. O CONTRATANTE está livre para divulgar sua imagem e contratar serviços semelhantes de terceiros.</p>

<h2>CLÁUSULA 9ª - RESPONSABILIDADE DA EMPRESA</h2>
<p>a) A CONTRATADA é integralmente responsável pela qualidade e execução dos serviços.</p>
<p>b) Eventuais reclamações devem ser dirigidas à CONTRATADA no prazo de 5 dias corridos após a entrega dos materiais.</p>

<h2>CLÁUSULA 10ª - FORO</h2>
<p>Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas do presente contrato, com exclusão de qualquer outro, por mais privilegiado que seja.</p>

<div class="signature-section">

<div class="signature">
<p>Nome: ${data.modelo.fullName}</p>

<div class="digital-signature-contratante">
<div class="signature-name">
<span class="signature-icon">📄</span>${data.modelo.fullName}
</div>
<div class="signature-details">Data 01/08/2025 13:10</div>
<div class="signature-details">4a1:1ba:11:5ce:91:f1b:0af:a4:2311:0c8:d0c</div>
</div>

<div class="signature-line"></div>
<p>Assinatura do Contratante</p>
</div>

<img src="/lovable-uploads/179cf6ea-af3d-4ea8-90be-51d2c4bbe054.png" 
     alt="Assinatura Super Fotos" 
     class="company-signature-img" />

<div class="signature-line-simple">
Assinatura: <span class="signature-underline"></span>
</div>
</div>

</div>

</body>
</html>`;
