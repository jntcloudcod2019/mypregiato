using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Pregiato.Core.Entities;
using Pregiato.Infrastructure.Data;
using PuppeteerSharp;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Pregiato.Application.Services;

public class ContractService : IContractService
{
    private readonly PregiatoDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ContractService> _logger;
    private readonly IConfiguration _configuration;

    public ContractService(
        PregiatoDbContext context,
        IMapper mapper,
        ILogger<ContractService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<ContractDto> CreateContractAsync(CreateContractDto dto)
    {
        try
        {
            var contract = _mapper.Map<Contract>(dto);
            contract.Id = Guid.NewGuid();
            contract.Status = "DRAFT";
            contract.CreatedAt = DateTime.UtcNow;
            contract.UpdatedAt = DateTime.UtcNow;

            _context.Contracts.Add(contract);
            await _context.SaveChangesAsync();

            return _mapper.Map<ContractDto>(contract);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar contrato");
            throw;
        }
    }

    public async Task<ContractDto?> GetContractByIdAsync(Guid id)
    {
        var contract = await _context.Contracts
            .Include(c => c.Talent)
            .FirstOrDefaultAsync(c => c.Id == id);

        return _mapper.Map<ContractDto>(contract);
    }

    public async Task<IEnumerable<ContractDto>> GetAllContractsAsync()
    {
        var contracts = await _context.Contracts
            .Include(c => c.Talent)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ContractDto>>(contracts);
    }

    public async Task<ContractDto> UpdateContractAsync(Guid id, UpdateContractDto dto)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null)
            throw new ArgumentException("Contrato não encontrado");

        _mapper.Map(dto, contract);
        contract.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<ContractDto>(contract);
    }

    public async Task<bool> DeleteContractAsync(Guid id)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null)
            return false;

        _context.Contracts.Remove(contract);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<byte[]> GenerateContractPdfAsync(Guid contractId, string contractType)
    {
        try
        {
            var contract = await _context.Contracts
                .Include(c => c.Talent)
                .FirstOrDefaultAsync(c => c.Id == contractId);

            if (contract == null)
                throw new ArgumentException("Contrato não encontrado");

            // Buscar template do contrato
            var template = await _context.ContractTemplates
                .FirstOrDefaultAsync(t => t.Type == contractType && t.IsActive);

            if (template == null)
                throw new ArgumentException("Template de contrato não encontrado");

            // Gerar HTML do contrato
            var htmlContent = GenerateContractHtml(template.HtmlContent, contract);

            // Gerar PDF usando PuppeteerSharp
            var pdfBytes = await GeneratePdfFromHtmlAsync(htmlContent);

            // Salvar PDF no sistema de arquivos
            var fileName = $"contract_{contractId}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var filePath = Path.Combine(_configuration["FileStorage:BasePath"], "contracts", fileName);
            
            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }
            await File.WriteAllBytesAsync(filePath, pdfBytes);

            // Atualizar contrato com caminho do PDF
            contract.PdfPath = filePath;
            contract.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return pdfBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao gerar PDF do contrato {ContractId}", contractId);
            throw;
        }
    }

    private string GenerateContractHtml(string template, Contract contract)
    {
        var html = template;

        // Substituir placeholders pelos dados do contrato
        var replacements = new Dictionary<string, string>
        {
            {"{{TALENT_NAME}}", contract.TalentName ?? ""},
            {"{{TALENT_EMAIL}}", contract.TalentEmail ?? ""},
            {"{{TALENT_DOCUMENT}}", contract.TalentDocument ?? ""},
            {"{{TALENT_PHONE}}", contract.TalentPhone ?? ""},
            {"{{TALENT_ADDRESS}}", contract.TalentAddress ?? ""},
            {"{{CONTRACT_NUMBER}}", contract.ContractNumber ?? ""},
            {"{{START_DATE}}", contract.StartDate?.ToString("dd/MM/yyyy") ?? ""},
            {"{{END_DATE}}", contract.EndDate?.ToString("dd/MM/yyyy") ?? ""},
            {"{{VALUE}}", contract.Value?.ToString("C") ?? ""},
            {"{{PAYMENT_TERMS}}", contract.PaymentTerms ?? ""},
            {"{{SERVICES}}", contract.Services ?? ""},
            {"{{CONDITIONS}}", contract.Conditions ?? ""},
            {"{{COMPANY_NAME}}", contract.CompanyName ?? ""},
            {"{{COMPANY_DOCUMENT}}", contract.CompanyDocument ?? ""},
            {"{{COMPANY_ADDRESS}}", contract.CompanyAddress ?? ""},
            {"{{COMPANY_PHONE}}", contract.CompanyPhone ?? ""},
            {"{{COMPANY_EMAIL}}", contract.CompanyEmail ?? ""},
            {"{{CURRENT_DATE}}", DateTime.Now.ToString("dd/MM/yyyy")},
            {"{{CURRENT_YEAR}}", DateTime.Now.Year.ToString()}
        };

        foreach (var replacement in replacements)
        {
            html = html.Replace(replacement.Key, replacement.Value);
        }

        return html;
    }

    private async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
    {
        // Configurar PuppeteerSharp
        var browserOptions = new LaunchOptions
        {
            Headless = true,
            Args = new[] { "--no-sandbox" }
        };

        // Adicionar estilos CSS para melhor formatação
        var fullHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 20px;
            color: #000;
        }}
        h1, h2, h3 {{
            color: #333;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .signature-section {{
            margin-top: 50px;
            page-break-inside: avoid;
        }}
        @media print {{
            body {{
                margin: 0;
                padding: 20px;
            }}
        }}
    </style>
</head>
<body>
    {htmlContent}
</body>
</html>";

        using var browser = await Puppeteer.LaunchAsync(browserOptions);
        using var page = await browser.NewPageAsync();

        // Configurar viewport para A4
        await page.SetViewportAsync(new ViewPortOptions
        {
            Width = 794,
            Height = 1123
        });

        // Carregar HTML
        await page.SetContentAsync(fullHtml);

        // Aguardar renderização
        await page.WaitForTimeoutAsync(2000);

        // Gerar PDF
        var pdfOptions = new PdfOptions
        {
            PrintBackground = true
        };

        var pdfBytes = await page.PdfDataAsync(pdfOptions);
        return pdfBytes;
    }

    public async Task<IEnumerable<ContractTemplateDto>> GetContractTemplatesAsync()
    {
        var templates = await _context.ContractTemplates
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ContractTemplateDto>>(templates);
    }

    public async Task<ContractTemplateDto> CreateContractTemplateAsync(CreateContractTemplateDto dto)
    {
        var template = _mapper.Map<ContractTemplate>(dto);
        template.Id = Guid.NewGuid();
        template.IsActive = true;
        template.Version = 1;
        template.CreatedAt = DateTime.UtcNow;
        template.UpdatedAt = DateTime.UtcNow;

        _context.ContractTemplates.Add(template);
        await _context.SaveChangesAsync();

        return _mapper.Map<ContractTemplateDto>(template);
    }
} 