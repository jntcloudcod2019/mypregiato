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

.signature-img {
width: 150px;
height: auto;
display: block;
margin: 15px auto;
object-fit: contain;
border: 1px solid #ddd;
padding: 5px;
background-color: white;
}

.company-signature {
border: 2px solid #333;
padding: 25px;
margin: 30px auto;
width: 400px;
background-color: #f9f9f9;
text-align: center;
}

.company-title {
font-size: 18px;
font-weight: bold;
margin-bottom: 20px;
text-transform: uppercase;
}

.signature-label {
font-size: 14px;
font-weight: bold;
margin-bottom: 10px;
}

.company-info {
margin: 10px 0;
font-size: 12px;
}

.signature-timestamp {
font-size: 11px;
color: #666;
margin-top: 5px;
}

.digital-signature {
background-color: #e8f4fd;
border: 1px solid #4a9eff;
border-radius: 5px;
padding: 10px;
margin: 15px 0;
display: inline-block;
}

.digital-signature-text {
color: #4a9eff;
font-size: 12px;
font-weight: bold;
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
<div class="signature-line"></div>
<p>Assinatura do Contratante</p>
</div>

<div class="company-signature">
<div class="company-title">SUPER FOTOS FOTOGRAFIAS LTDA</div>
<div class="company-info">CNPJ: 13.310.215/0001-50</div>
<div style="margin: 20px 0;">
<div class="signature-label">Assinatura:</div>
<div class="digital-signature">
<div class="digital-signature-text">📄 Super Fotos Fotografias Ltda</div>
<div class="signature-timestamp">Data 01/08/2025 12:11</div>
<div style="font-size: 10px; color: #666;">4a:1ba:11:5ce:91:f1b:0af:a4:2311:0c8:d0c</div>
</div>
</div>
<img src="/lovable-uploads/f5ad4329-0123-4568-b84c-14389033fc2d.png" alt="Assinatura Super Fotos" class="signature-img" />
<div class="signature-line"></div>
<p style="margin-top: 10px; font-size: 14px; font-weight: bold;">Representante Legal</p>
</div>

</div>

</body>
</html>`;
