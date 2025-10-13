using FluentValidation;
using Pregiato.Application.DTOs;

namespace Pregiato.Application.Validators
{
    public class CreateTrainingLessonValidator : AbstractValidator<CreateTrainingLessonDto>
    {
        public CreateTrainingLessonValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Título da aula é obrigatório")
                .MaximumLength(200)
                .WithMessage("Título deve ter no máximo 200 caracteres");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Descrição da aula é obrigatória")
                .MinimumLength(5)
                .WithMessage("Descrição deve ter pelo menos 5 caracteres");

            RuleFor(x => x.OrderIndex)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Índice da ordem deve ser maior ou igual a 0");

            RuleFor(x => x.VideoSize)
                .GreaterThan(0)
                .WithMessage("Tamanho do vídeo deve ser maior que 0")
                .LessThanOrEqualTo(500 * 1024 * 1024) // 500MB
                .WithMessage("Tamanho do vídeo não pode exceder 500MB")
                .When(x => x.VideoSize.HasValue);

            RuleFor(x => x.VideoDurationSeconds)
                .GreaterThan(0)
                .WithMessage("Duração do vídeo deve ser maior que 0")
                .LessThanOrEqualTo(3600) // 1 hora
                .WithMessage("Duração do vídeo não pode exceder 1 hora")
                .When(x => x.VideoDurationSeconds.HasValue);

            RuleFor(x => x.VideoMimeType)
                .Must(BeValidVideoMimeType)
                .WithMessage("Tipo de arquivo deve ser um vídeo válido (mp4, webm, mov)")
                .When(x => !string.IsNullOrEmpty(x.VideoMimeType));
        }

        private bool BeValidVideoMimeType(string? mimeType)
        {
            if (string.IsNullOrEmpty(mimeType))
                return true;

            var validMimeTypes = new[]
            {
                "video/mp4",
                "video/webm",
                "video/quicktime",
                "video/x-msvideo"
            };

            return validMimeTypes.Contains(mimeType.ToLower());
        }
    }

    public class UpdateTrainingLessonValidator : AbstractValidator<UpdateTrainingLessonDto>
    {
        public UpdateTrainingLessonValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Título da aula é obrigatório")
                .MaximumLength(200)
                .WithMessage("Título deve ter no máximo 200 caracteres");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Descrição da aula é obrigatória")
                .MinimumLength(5)
                .WithMessage("Descrição deve ter pelo menos 5 caracteres");

            RuleFor(x => x.OrderIndex)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Índice da ordem deve ser maior ou igual a 0");

            RuleFor(x => x.VideoSize)
                .GreaterThan(0)
                .WithMessage("Tamanho do vídeo deve ser maior que 0")
                .LessThanOrEqualTo(500 * 1024 * 1024) // 500MB
                .WithMessage("Tamanho do vídeo não pode exceder 500MB")
                .When(x => x.VideoSize.HasValue);

            RuleFor(x => x.VideoDurationSeconds)
                .GreaterThan(0)
                .WithMessage("Duração do vídeo deve ser maior que 0")
                .LessThanOrEqualTo(3600) // 1 hora
                .WithMessage("Duração do vídeo não pode exceder 1 hora")
                .When(x => x.VideoDurationSeconds.HasValue);

            RuleFor(x => x.VideoMimeType)
                .Must(BeValidVideoMimeType)
                .WithMessage("Tipo de arquivo deve ser um vídeo válido (mp4, webm, mov)")
                .When(x => !string.IsNullOrEmpty(x.VideoMimeType));
        }

        private bool BeValidVideoMimeType(string? mimeType)
        {
            if (string.IsNullOrEmpty(mimeType))
                return true;

            var validMimeTypes = new[]
            {
                "video/mp4",
                "video/webm",
                "video/quicktime",
                "video/x-msvideo"
            };

            return validMimeTypes.Contains(mimeType.ToLower());
        }
    }
}
