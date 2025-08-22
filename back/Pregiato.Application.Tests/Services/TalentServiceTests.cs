using AutoFixture;
using AutoFixture.AutoMoq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Pregiato.Application.DTOs;
using Pregiato.Application.Services;
using Pregiato.Application.Validators;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using FluentValidation;
using FluentValidation.Results;
using AutoMapper;
using Xunit;

namespace Pregiato.Application.Tests.Services;

public class TalentServiceTests
{
    private readonly IFixture _fixture;
    private readonly Mock<ITalentRepository> _mockRepository;
    private readonly Mock<ILogger<TalentService>> _mockLogger;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IValidator<CreateTalentDto>> _mockCreateValidator;
    private readonly Mock<IValidator<UpdateTalentDto>> _mockUpdateValidator;
    private readonly TalentService _service;

    public TalentServiceTests()
    {
        _fixture = new Fixture()
            .Customize(new AutoMoqCustomization());
        
        _mockRepository = new Mock<ITalentRepository>();
        _mockLogger = new Mock<ILogger<TalentService>>();
        _mockMapper = new Mock<IMapper>();
        _mockCreateValidator = new Mock<IValidator<CreateTalentDto>>();
        _mockUpdateValidator = new Mock<IValidator<UpdateTalentDto>>();
        
        _service = new TalentService(
            _mockRepository.Object,
            _mockLogger.Object,
            _mockMapper.Object,
            _mockCreateValidator.Object,
            _mockUpdateValidator.Object
        );
    }

    [Fact]
    public async Task CreateAsync_WithValidDto_ShouldCreateTalentSuccessfully()
    {
        // Arrange
        var createDto = new CreateTalentDto
        {
            FullName = "João Silva",
            Email = "joao@email.com",
            Phone = "11999999999",
            Document = "12345678901",
            BirthDate = new DateTime(1990, 1, 1),
            Age = 33,
            Gender = "Masculino",
            Postalcode = "01234-567",
            Street = "Rua das Flores",
            City = "São Paulo",
            Uf = "SP",
            Neighborhood = "Centro",
            NumberAddress = "123",
            Complement = "Apto 1",
            ProducerId = "PROD001"
        };

        var talent = new Talent
        {
            Id = Guid.NewGuid(),
            FullName = createDto.FullName,
            Email = createDto.Email,
            Phone = createDto.Phone,
            Document = createDto.Document,
            BirthDate = createDto.BirthDate,
            Age = createDto.Age,
            Gender = createDto.Gender,
            Postalcode = createDto.Postalcode,
            Street = createDto.Street,
            City = createDto.City,
            Uf = createDto.Uf,
            Neighborhood = createDto.Neighborhood,
            NumberAddress = createDto.NumberAddress,
            Complement = createDto.Complement,
            ProducerId = createDto.ProducerId,
            InviteSent = false,
            Status = true,
            DnaStatus = "UNDEFINED",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var talentDto = new TalentDto
        {
            Id = talent.Id,
            FullName = talent.FullName,
            Email = talent.Email,
            Phone = talent.Phone,
            Document = talent.Document,
            BirthDate = talent.BirthDate,
            Age = talent.Age,
            Gender = talent.Gender,
            Postalcode = talent.Postalcode,
            Street = talent.Street,
            City = talent.City,
            Uf = talent.Uf,
            Neighborhood = talent.Neighborhood,
            NumberAddress = talent.NumberAddress,
            Complement = talent.Complement,
            ProducerId = talent.ProducerId,
            InviteSent = talent.InviteSent,
            Status = talent.Status,
            DnaStatus = talent.DnaStatus,
            CreatedAt = talent.CreatedAt,
            UpdatedAt = talent.UpdatedAt
        };

        var validationResult = new ValidationResult(); // Válido
        
        _mockCreateValidator
            .Setup(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(validationResult);
        
        _mockMapper
            .Setup(x => x.Map<Talent>(It.IsAny<CreateTalentDto>()))
            .Returns(talent);
        
        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Talent>()))
            .ReturnsAsync(talent);
        
        _mockMapper
            .Setup(x => x.Map<TalentDto>(It.IsAny<Talent>()))
            .Returns(talentDto);

        // Act
        var result = await _service.CreateAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        result.FullName.Should().Be(createDto.FullName);
        result.Email.Should().Be(createDto.Email);
        result.Phone.Should().Be(createDto.Phone);
        result.Document.Should().Be(createDto.Document);
        result.Age.Should().Be(createDto.Age);
        result.Gender.Should().Be(createDto.Gender);
        result.InviteSent.Should().BeFalse();
        result.Status.Should().BeTrue();
        result.DnaStatus.Should().Be("UNDEFINED");
        
        _mockCreateValidator.Verify(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(x => x.CreateAsync(It.IsAny<Talent>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithInvalidDto_ShouldThrowValidationException()
    {
        // Arrange
        var createDto = new CreateTalentDto
        {
            FullName = "", // Inválido - nome vazio
            Email = "email-invalido",
            Phone = "123", // Inválido - telefone muito curto
            Document = "",
            BirthDate = new DateTime(1990, 1, 1),
            Age = -1, // Inválido - idade negativa
            Gender = "",
            Postalcode = "",
            Street = "",
            City = "",
            Uf = "",
            Neighborhood = "",
            NumberAddress = "",
            Complement = "",
            ProducerId = ""
        };

        var validationErrors = new List<ValidationFailure>
        {
            new ValidationFailure("FullName", "Nome completo é obrigatório"),
            new ValidationFailure("Email", "Email inválido"),
            new ValidationFailure("Phone", "Telefone é obrigatório"),
            new ValidationFailure("Document", "CPF/CNPJ é obrigatório"),
            new ValidationFailure("Age", "Idade deve ser maior que 0"),
            new ValidationFailure("Gender", "Gênero é obrigatório"),
            new ValidationFailure("Postalcode", "CEP é obrigatório"),
            new ValidationFailure("Street", "Rua é obrigatória"),
            new ValidationFailure("City", "Cidade é obrigatória"),
            new ValidationFailure("Uf", "UF é obrigatório"),
            new ValidationFailure("Neighborhood", "Bairro é obrigatório"),
            new ValidationFailure("NumberAddress", "Número é obrigatório"),
            new ValidationFailure("ProducerId", "Produtor é obrigatório")
        };

        var validationResult = new ValidationResult(validationErrors);
        
        _mockCreateValidator
            .Setup(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(validationResult);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        
        exception.Errors.Should().HaveCount(validationErrors.Count);
        exception.Errors.Should().Contain(e => e.PropertyName == "FullName");
        exception.Errors.Should().Contain(e => e.PropertyName == "Email");
        exception.Errors.Should().Contain(e => e.PropertyName == "Phone");
        
        _mockCreateValidator.Verify(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(x => x.CreateAsync(It.IsAny<Talent>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ShouldSetDefaultValuesCorrectly()
    {
        // Arrange
        var createDto = new CreateTalentDto
        {
            FullName = "Maria Silva",
            Email = "maria@email.com",
            Phone = "11988888888",
            Document = "98765432100",
            BirthDate = new DateTime(1985, 5, 15),
            Age = 38,
            Gender = "Feminino",
            Postalcode = "04567-890",
            Street = "Avenida Paulista",
            City = "São Paulo",
            Uf = "SP",
            Neighborhood = "Bela Vista",
            NumberAddress = "456",
            Complement = "Sala 10",
            ProducerId = "PROD002"
        };

        var talent = new Talent();
        var talentDto = new TalentDto();

        var validationResult = new ValidationResult();
        
        _mockCreateValidator
            .Setup(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(validationResult);
        
        _mockMapper
            .Setup(x => x.Map<Talent>(It.IsAny<CreateTalentDto>()))
            .Returns(talent);
        
        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Talent>()))
            .ReturnsAsync(talent);
        
        _mockMapper
            .Setup(x => x.Map<TalentDto>(It.IsAny<Talent>()))
            .Returns(talentDto);

        // Act
        await _service.CreateAsync(createDto);

        // Assert
        _mockMapper.Verify(x => x.Map<Talent>(It.Is<CreateTalentDto>(dto => 
            dto.FullName == createDto.FullName &&
            dto.Email == createDto.Email &&
            dto.Phone == createDto.Phone &&
            dto.Document == createDto.Document &&
            dto.Age == createDto.Age &&
            dto.Gender == createDto.Gender
        )), Times.Once);
        
        _mockRepository.Verify(x => x.CreateAsync(It.Is<Talent>(t => 
            t.InviteSent == false &&
            t.Status == true &&
            t.DnaStatus == "UNDEFINED" &&
            t.CreatedAt != default &&
            t.UpdatedAt != default
        )), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithRepositoryException_ShouldPropagateException()
    {
        // Arrange
        var createDto = new CreateTalentDto
        {
            FullName = "João Silva",
            Email = "joao@email.com",
            Phone = "11999999999",
            Document = "12345678901",
            BirthDate = new DateTime(1990, 1, 1),
            Age = 33,
            Gender = "Masculino",
            Postalcode = "01234-567",
            Street = "Rua das Flores",
            City = "São Paulo",
            Uf = "SP",
            Neighborhood = "Centro",
            NumberAddress = "123",
            Complement = "Apto 1",
            ProducerId = "PROD001"
        };

        var validationResult = new ValidationResult();
        var repositoryException = new Exception("Erro no banco de dados");
        
        _mockCreateValidator
            .Setup(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(validationResult);
        
        _mockMapper
            .Setup(x => x.Map<Talent>(It.IsAny<CreateTalentDto>()))
            .Returns(new Talent());
        
        _mockRepository
            .Setup(x => x.CreateAsync(It.IsAny<Talent>()))
            .ThrowsAsync(repositoryException);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(() => _service.CreateAsync(createDto));
        
        exception.Message.Should().Be("Erro no banco de dados");
        
        _mockCreateValidator.Verify(x => x.ValidateAsync(It.IsAny<CreateTalentDto>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(x => x.CreateAsync(It.IsAny<Talent>()), Times.Once);
    }
}
