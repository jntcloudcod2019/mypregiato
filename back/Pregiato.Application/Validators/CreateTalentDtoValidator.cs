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

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email é obrigatório")
            .EmailAddress().WithMessage("Email deve ser válido")
            .MaximumLength(255).WithMessage("Email deve ter no máximo 255 caracteres");

        RuleFor(x => x.Age)
            .GreaterThan(0).WithMessage("Idade deve ser maior que 0")
            .LessThanOrEqualTo(150).WithMessage("Idade deve ser menor ou igual a 150");

        RuleFor(x => x.Document)
            .MaximumLength(20).WithMessage("Documento deve ter no máximo 20 caracteres");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Telefone deve ter no máximo 20 caracteres");

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Endereço deve ter no máximo 500 caracteres");

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("Cidade deve ter no máximo 100 caracteres");

        RuleFor(x => x.State)
            .MaximumLength(50).WithMessage("Estado deve ter no máximo 50 caracteres");

        RuleFor(x => x.ZipCode)
            .MaximumLength(10).WithMessage("CEP deve ter no máximo 10 caracteres");

        RuleFor(x => x.Instagram)
            .MaximumLength(255).WithMessage("Instagram deve ter no máximo 255 caracteres");

        RuleFor(x => x.TikTok)
            .MaximumLength(255).WithMessage("TikTok deve ter no máximo 255 caracteres");

        RuleFor(x => x.YouTube)
            .MaximumLength(255).WithMessage("YouTube deve ter no máximo 255 caracteres");

        RuleFor(x => x.OtherSocialMedia)
            .MaximumLength(500).WithMessage("Outras redes sociais devem ter no máximo 500 caracteres");

        RuleFor(x => x.Height)
            .MaximumLength(10).WithMessage("Altura deve ter no máximo 10 caracteres");

        RuleFor(x => x.Weight)
            .MaximumLength(10).WithMessage("Peso deve ter no máximo 10 caracteres");

        RuleFor(x => x.Bust)
            .MaximumLength(10).WithMessage("Busto deve ter no máximo 10 caracteres");

        RuleFor(x => x.Waist)
            .MaximumLength(10).WithMessage("Cintura deve ter no máximo 10 caracteres");

        RuleFor(x => x.Hip)
            .MaximumLength(10).WithMessage("Quadril deve ter no máximo 10 caracteres");

        RuleFor(x => x.ShoeSize)
            .MaximumLength(5).WithMessage("Tamanho do sapato deve ter no máximo 5 caracteres");

        RuleFor(x => x.HairColor)
            .MaximumLength(50).WithMessage("Cor do cabelo deve ter no máximo 50 caracteres");

        RuleFor(x => x.EyeColor)
            .MaximumLength(50).WithMessage("Cor dos olhos deve ter no máximo 50 caracteres");

        RuleFor(x => x.SkinTone)
            .MaximumLength(50).WithMessage("Tom de pele deve ter no máximo 50 caracteres");

        RuleFor(x => x.Ethnicity)
            .MaximumLength(100).WithMessage("Etnia deve ter no máximo 100 caracteres");

        RuleFor(x => x.Nationality)
            .MaximumLength(100).WithMessage("Nacionalidade deve ter no máximo 100 caracteres");

        RuleFor(x => x.Languages)
            .MaximumLength(500).WithMessage("Idiomas devem ter no máximo 500 caracteres");

        RuleFor(x => x.Skills)
            .MaximumLength(1000).WithMessage("Habilidades devem ter no máximo 1000 caracteres");

        RuleFor(x => x.Experience)
            .MaximumLength(1000).WithMessage("Experiência deve ter no máximo 1000 caracteres");

        RuleFor(x => x.Availability)
            .MaximumLength(500).WithMessage("Disponibilidade deve ter no máximo 500 caracteres");

        RuleFor(x => x.TravelAvailability)
            .MaximumLength(500).WithMessage("Disponibilidade para viagem deve ter no máximo 500 caracteres");

        RuleFor(x => x.Rate)
            .MaximumLength(100).WithMessage("Taxa deve ter no máximo 100 caracteres");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Observações devem ter no máximo 2000 caracteres");
    }
} 