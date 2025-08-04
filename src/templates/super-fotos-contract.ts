

export const getContractTemplate = (data: any) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contrato de Prestação de Serviços Fotográficos</title>
<style>
body {
font-family: 'Times New Roman', Times, serif;
font-size: 12pt;
line-height: 1.4;
margin: 20px;
color: #000000;
background-color: #ffffff;
}

h1 {
font-size: 12pt;
font-weight: bold;
text-align: center;
margin-bottom: 20px;
}

h2 {
font-size: 12pt;
font-weight: bold;
margin-top: 15px;
margin-bottom: 8px;
}

p {
margin: 8px 0;
text-align: justify;
}

.contract-field {
font-weight: normal;
color: #000000;
}

.signature-section {
margin-top: 40px;
text-align: center;
page-break-inside: avoid;
}

.company-signature-img {
width: 200px;
height: auto;
display: block;
margin: 15px auto;
object-fit: contain;
}

.signature-line {
margin: 20px 0;
text-align: center;
}

.page-break {
page-break-before: always;
}

/* Ajustes para garantir 2 páginas */
.clause {
margin-bottom: 12px;
}

.clause-title {
font-weight: bold;
margin-bottom: 6px;
}

.clause-content {
margin-bottom: 8px;
}
</style>
</head>
<body>
<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS</h1>

<p>${data.cidade} - ${data.uf}, ${data.dia} de ${data.mes} de ${data.ano}.</p>

<p>Pelo presente instrumento particular de contrato, as partes abaixo qualificadas, a saber:</p>

<div class="clause">
<p><span class="clause-title">CONTRATANTE:</span> <span class="contract-field">${data.modelo.fullName}</span>, inscrito(a) no CPF: <span class="contract-field">${data.modelo.document}</span>, residente e domiciliada no endereço <span class="contract-field">${data.modelo.street}</span>, nº <span class="contract-field">${data.modelo.numberAddress || 'S/N'}</span>, <span class="contract-field">${data.modelo.complement || ''}</span>, localizado no bairro <span class="contract-field">${data.modelo.neighborhood}</span>, situado na cidade <span class="contract-field">${data.modelo.city}</span> - <span class="contract-field">${data.uf}</span> CEP: <span class="contract-field">${data.modelo.postalcode}</span>, tendo como telefone principal: <span class="contract-field">${data.modelo.phone}</span>.</p>

<p><span class="clause-title">CONTRATADA: SUPER FOTOS FOTOGRAFIAS LTDA</span>, inscrita no CNPJ sob o nº 13.310.215/0001-50, com sede na Avenida Paulista, nº 1636 – salas 1105/1324 – Bela Vista – São Paulo – SP – CEP: 01310-200, telefone oficial: (11) 94596-5019, representada por quem de direito via cartão CNPJ.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 1ª - OBJETO DO CONTRATO</p>
<p class="clause-content">A CONTRATADA compromete-se a prestar serviços de produção de material fotográfico, incluindo:</p>
<p class="clause-content">a) Produção fotográfica: realização de ensaios fotográficos conforme especificado pelas partes.</p>
<p class="clause-content">b) Edição de fotos: tratamento e aprimoramento das imagens capturadas.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 2ª - DAS OBRIGAÇÕES DAS PARTES</p>
<p class="clause-content">As obrigações das partes no presente contrato estão definidas conforme os seguintes termos e em conformidade com o Código Civil Brasileiro e o Código de Defesa do Consumidor (Lei nº 8.078/1990):</p>
<p class="clause-content"><strong>1. Obrigações da CONTRATADA:</strong></p>
<p class="clause-content">a) Disponibilizar estúdio equipado, equipe especializada e realizar a entrega do material nos prazos acordados.</p>
<p class="clause-content">b) Manter a transparência em todos os processos, fornecendo informações claras sobre os serviços executados.</p>
<p class="clause-content"><strong>2. Obrigações do(a) CONTRATANTE:</strong></p>
<p class="clause-content">a) Fornecer todas as informações necessárias para a execução do contrato, como dados pessoais e documentos.</p>
<p class="clause-content">b) Comparecer pontualmente às sessões fotográficas agendadas.</p>
<p class="clause-content">c) Efetuar os pagamentos nos prazos e condições estabelecidos neste contrato.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 3ª - PRODUÇÃO FOTOGRÁFICA</p>
<p class="clause-content">a) Equipamentos profissionais: câmeras de alta resolução e iluminação adequada.</p>
<p class="clause-content">b) Equipe especializada: maquiadores e fotógrafos qualificados.</p>
<p class="clause-content">c) O material fotográfico será entregue ao(à) CONTRATANTE no prazo de até 05 (cinco) dias úteis após a sessão fotográfica.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 4ª - PAGAMENTO</p>
<p class="clause-content">Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de R$ <span class="contract-field">${data.valorContrato || '0,00'}</span>, sendo:</p>
<p class="clause-content">a) Pagamento à vista ou parcelado conforme acordo entre as partes.</p>
<p class="clause-content">b) Em caso de pagamento via cartão de crédito, débito e PIX, o CONTRATANTE compromete-se a não solicitar chargebacks (processo de estorno de um valor pago junto as bandeiras de cartão) após a entrega do material, salvo em caso do descumprimento do presente contrato.</p>
<p class="clause-content">c) Fica a critério da CONTRATADA a concessão de descontos e facilitação das formas de pagamento de acordo com sua discricionaridade.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 5ª - DIREITO DE IMAGEM</p>
<p class="clause-content">O CONTRATANTE cede à CONTRATADA, o direito de uso das imagens obtidas nas sessões fotográficas realizadas, para os seguintes fins:</p>
<p class="clause-content">a) Divulgação junto a empresas parceiras da CONTRATADA.</p>
<p class="clause-content">b) O presente instrumento concede a autorização de uso de imagem em todo território nacional e internacional, em todas as modalidades de uso, desde que respeitadas a legislação estabelecida no território de onde será utilizada a imagem, sem trazer nenhum prejuízo moral ou penal ao cedente.</p>
</div>

<div class="page-break"></div>

<div class="clause">
<p class="clause-title">CLÁUSULA 6ª - ACEITAÇÃO E IRREVOGABILIDADE</p>
<p class="clause-content">a) As partes declaram que celebram o presente contrato em comum acordo, com plena ciência de seus direitos e deveres</p>
<p class="clause-content">b) O CONTRATANTE declara estar ciente que os materiais produzidos são personalizados e exclusivos.</p>
<p class="clause-content">c) Após a entrega dos materiais, o CONTRATANTE confirma sua aceitação dos serviços e produtos fornecidos.</p>
<p class="clause-content">d) O material fotográfico será entregue de forma digital em dispositivo de armazenamento portátil (pen drive)</p>
<p class="clause-content">e) No ato da entrega do material fotográfico, a CONTRATADA irá realizar testes na presença do CONTRATANTE a fim verificar a capacidade de reconhecimento do dispositivo e materiais fotográficos ali presentes.</p>
<p class="clause-content">f) O CONTRATANTE não se responsabiliza por danos causados por mau uso posterior ao teste realizado no ato da entrega.</p>
<p class="clause-content">g) Não será permitido cancelamento, devolução ou reembolso dos valores pagos, salvo em caso de vícios ou defeitos comprovados.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 7ª - DA ISENÇÃO DAS AGÊNCIAS DE MODELOS</p>
<p class="clause-content">a) O CONTRATANTE declara estar ciente de que a contratação dos serviços da EMPRESA é independente do agenciamento realizado pela agência de modelos.</p>
<p class="clause-content">b) Nenhuma agência de modelo presente no evento possui qualquer responsabilidade, seja ela SOLIDARIA e OU SUBSIDIÁRIA pelo objeto presente neste instrumento.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 8ª - EXCLUSIVIDADE</p>
<p class="clause-content">a) Este contrato não estabelece exclusividade entre as partes. O CONTRATANTE está livre para divulgar sua imagem e contratar serviços semelhantes de terceiros</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 9ª - RESPONSABILIDADE DA EMPRESA</p>
<p class="clause-content">a) A CONTRATADA é integralmente responsável pela qualidade e execução dos serviços.</p>
<p class="clause-content">b) Eventuais reclamações devem ser dirigidas à CONTRATADA no prazo de 5 dias corridos após a entrega dos materiais.</p>
</div>

<div class="clause">
<p class="clause-title">CLÁUSULA 10ª - FORO</p>
<p class="clause-content">Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas do presente contrato, com exclusão de qualquer outro, por mais privilegiado que seja.</p>
</div>

<div class="signature-section">
<p><strong>Nome: ${data.modelo.fullName}</strong></p>
<div class="signature-line">
<p>Assinatura: &nbsp; &nbsp; _____________________________________</p>
</div>

<p><strong>SUPER FOTOS FOTOGRAFIAS LTDA</strong></p>

<img src="/lovable-uploads/8ace2026-768e-4a21-a650-6e0658916e7d.png" 
     alt="Assinatura Super Fotos" 
     class="company-signature-img" />

<div class="signature-line">
<p>Assinatura: &nbsp; &nbsp; &nbsp;_____________________________________</p>
</div>
</div>

</body>
</html>`;

