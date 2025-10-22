using FluentValidation;
using Pregiato.Application.DTOs;

namespace Pregiato.Application.Validators
{
    public class CreateTrainingCourseValidator : AbstractValidator<CreateTrainingCourseDto>
    {
        public CreateTrainingCourseValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Título é obrigatório")
                .MaximumLength(200)
                .WithMessage("Título deve ter no máximo 200 caracteres");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Descrição é obrigatória")
                .MinimumLength(5)
                .WithMessage("Descrição deve ter pelo menos 5 caracteres");

            RuleFor(x => x.Category)
                .MaximumLength(100)
                .WithMessage("Categoria deve ter no máximo 100 caracteres");

            RuleFor(x => x.Difficulty)
                .MaximumLength(50)
                .WithMessage("Dificuldade deve ter no máximo 50 caracteres")
                .When(x => !string.IsNullOrEmpty(x.Difficulty));

            RuleFor(x => x.CreatedBy)
                .NotEmpty()
                .WithMessage("Criador é obrigatório")
                .MaximumLength(100)
                .WithMessage("Criador deve ter no máximo 100 caracteres");

            // ✅ LESSONS OPCIONAIS - Permitir criar curso sem aulas inicialmente
            RuleForEach(x => x.Lessons)
                .SetValidator(new CreateTrainingLessonValidator())
                .When(x => x.Lessons != null && x.Lessons.Any());
        }
    }

    public class UpdateTrainingCourseValidator : AbstractValidator<UpdateTrainingCourseDto>
    {
        public UpdateTrainingCourseValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Título é obrigatório")
                .MaximumLength(200)
                .WithMessage("Título deve ter no máximo 200 caracteres");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Descrição é obrigatória")
                .MinimumLength(5)
                .WithMessage("Descrição deve ter pelo menos 5 caracteres");

            RuleFor(x => x.Category)
                .MaximumLength(100)
                .WithMessage("Categoria deve ter no máximo 100 caracteres");

            RuleFor(x => x.Difficulty)
                .MaximumLength(50)
                .WithMessage("Dificuldade deve ter no máximo 50 caracteres")
                .When(x => !string.IsNullOrEmpty(x.Difficulty));
        }
    }
}
