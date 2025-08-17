using FluentValidation;
using Pregiato.Application.DTOs;

namespace Pregiato.Application.Validators;

public class CreateTalentDtoValidator : AbstractValidator<CreateTalentDto>
{
    public CreateTalentDtoValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Nome completo é obrigatório")
            .MaximumLength(255).WithMessage("Nome completo deve ter no máximo 255 caracteres");

        RuleFor(x => x.Document)
            .NotEmpty().WithMessage("CPF/CNPJ é obrigatório")
            .MinimumLength(11).WithMessage("CPF/CNPJ deve ter pelo menos 11 caracteres")
            .MaximumLength(20).WithMessage("Documento deve ter no máximo 20 caracteres");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email deve ser válido")
            .MaximumLength(255).WithMessage("Email deve ter no máximo 255 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Telefone é obrigatório")
            .MinimumLength(10).WithMessage("Telefone deve ter pelo menos 10 caracteres")
            .MaximumLength(20).WithMessage("Telefone deve ter no máximo 20 caracteres");

        RuleFor(x => x.BirthDate)
            .NotNull().WithMessage("Data de nascimento é obrigatória");

        RuleFor(x => x.Age)
            .InclusiveBetween(0, 120).WithMessage("Idade deve estar entre 0 e 120 anos");

        RuleFor(x => x.Gender)
            .NotEmpty().WithMessage("Gênero é obrigatório")
            .MaximumLength(20).WithMessage("Gênero deve ter no máximo 20 caracteres");

        RuleFor(x => x.Postalcode)
            .NotEmpty().WithMessage("CEP é obrigatório")
            .MinimumLength(8).WithMessage("CEP deve ter pelo menos 8 caracteres")
            .MaximumLength(10).WithMessage("CEP deve ter no máximo 10 caracteres");

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("Rua é obrigatória")
            .MaximumLength(255).WithMessage("Rua deve ter no máximo 255 caracteres");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Cidade é obrigatória")
            .MaximumLength(100).WithMessage("Cidade deve ter no máximo 100 caracteres");

        RuleFor(x => x.Uf)
            .NotEmpty().WithMessage("UF é obrigatório")
            .MaximumLength(2).WithMessage("UF deve ter no máximo 2 caracteres");

        RuleFor(x => x.Neighborhood)
            .NotEmpty().WithMessage("Bairro é obrigatório")
            .MaximumLength(100).WithMessage("Bairro deve ter no máximo 100 caracteres");

        RuleFor(x => x.NumberAddress)
            .NotEmpty().WithMessage("Número é obrigatório")
            .MaximumLength(20).WithMessage("Número deve ter no máximo 20 caracteres");

        RuleFor(x => x.Complement)
            .MaximumLength(255).WithMessage("Complemento deve ter no máximo 255 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Complement));

        RuleFor(x => x.ProducerId)
            .NotEmpty().WithMessage("Produtor é obrigatório")
            .MaximumLength(50).WithMessage("ID do produtor deve ter no máximo 50 caracteres");
    }
} 