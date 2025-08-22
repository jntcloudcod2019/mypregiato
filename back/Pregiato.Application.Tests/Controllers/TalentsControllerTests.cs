using AutoFixture;
using AutoFixture.AutoMoq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Pregiato.API.Controllers;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using FluentValidation;
using FluentValidation.Results;
using Xunit;

namespace Pregiato.Application.Tests.Controllers;

public class TalentsControllerTests
{
    private readonly IFixture _fixture;
    private readonly Mock<ITalentService> _mockTalentService;
    private readonly Mock<ILogger<TalentsController>> _mockLogger;
    private readonly TalentsController _controller;

    public TalentsControllerTests()
    {
        _fixture = new Fixture()
            .Customize(new AutoMoqCustomization());
        
        _mockTalentService = new Mock<ITalentService>();
        _mockLogger = new Mock<ILogger<TalentsController>>();
        
        _controller = new TalentsController(
            _mockTalentService.Object,
            _mockLogger.Object
        );
    }

    [Fact]
    public async Task CreateTalent_WithValidDto_ShouldReturnCreatedResult()
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

        var talentDto = new TalentDto
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

        _mockTalentService
            .Setup(x => x.CreateAsync(It.IsAny<CreateTalentDto>()))
            .ReturnsAsync(talentDto);

        // Act
        var result = await _controller.CreateTalent(createDto);

        // Assert
        result.Should().BeOfType<ActionResult<TalentDto>>();
        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var createdAtResult = result.Result as CreatedAtActionResult;
        createdAtResult!.Value.Should().BeOfType<TalentDto>();
        var returnedTalent = createdAtResult.Value as TalentDto;
        returnedTalent!.FullName.Should().Be(createDto.FullName);
        returnedTalent.Email.Should().Be(createDto.Email);
        returnedTalent.Phone.Should().Be(createDto.Phone);
        returnedTalent.Document.Should().Be(createDto.Document);
        returnedTalent.Age.Should().Be(createDto.Age);
        returnedTalent.Gender.Should().Be(createDto.Gender);
        returnedTalent.InviteSent.Should().BeFalse();
        returnedTalent.Status.Should().BeTrue();
        returnedTalent.DnaStatus.Should().Be("UNDEFINED");
        
        _mockTalentService.Verify(x => x.CreateAsync(It.IsAny<CreateTalentDto>()), Times.Once);
    }

    [Fact]
    public async Task CreateTalent_WithValidationException_ShouldReturnBadRequest()
    {
        // Arrange
        var createDto = new CreateTalentDto
        {
            FullName = "", // Inválido
            Email = "email-invalido",
            Phone = "123", // Inválido
            Document = "",
            BirthDate = new DateTime(1990, 1, 1),
            Age = -1, // Inválido
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

        var validationException = new ValidationException("Erro de validação");
        
        _mockTalentService
            .Setup(x => x.CreateAsync(It.IsAny<CreateTalentDto>()))
            .ThrowsAsync(validationException);

        // Act
        var result = await _controller.CreateTalent(createDto);

        // Assert
        result.Should().BeOfType<ActionResult<TalentDto>>();
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult!.Value.Should().NotBeNull();
        
        _mockTalentService.Verify(x => x.CreateAsync(It.IsAny<CreateTalentDto>()), Times.Once);
    }

    [Fact]
    public async Task CreateTalent_WithArgumentException_ShouldReturnBadRequest()
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

        var argumentException = new ArgumentException("Já existe um talento com este email ou documento.");
        
        _mockTalentService
            .Setup(x => x.CreateAsync(It.IsAny<CreateTalentDto>()))
            .ThrowsAsync(argumentException);

        // Act
        var result = await _controller.CreateTalent(createDto);

        // Assert
        result.Should().BeOfType<ActionResult<TalentDto>>();
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        var badRequestResult = result.Result as BadRequestObjectResult;
        badRequestResult!.Value.Should().NotBeNull();
        
        _mockTalentService.Verify(x => x.CreateAsync(It.IsAny<CreateTalentDto>()), Times.Once);
    }

    [Fact]
    public async Task CreateTalent_WithGenericException_ShouldReturnInternalServerError()
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

        var exception = new Exception("Erro interno do servidor");
        
        _mockTalentService
            .Setup(x => x.CreateAsync(It.IsAny<CreateTalentDto>()))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.CreateTalent(createDto);

        // Assert
        result.Should().BeOfType<ActionResult<TalentDto>>();
        result.Result.Should().BeOfType<ObjectResult>();
        var objectResult = result.Result as ObjectResult;
        objectResult!.StatusCode.Should().Be(500);
        
        _mockTalentService.Verify(x => x.CreateAsync(It.IsAny<CreateTalentDto>()), Times.Once);
    }

    

    [Fact]
    public async Task GetTalent_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var talentId = Guid.NewGuid();

        _mockTalentService
            .Setup(x => x.GetByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((TalentDto?)null);

        // Act
        var result = await _controller.GetTalent(talentId);

        // Assert
        result.Should().BeOfType<ActionResult<TalentDto>>();
        result.Result.Should().BeOfType<NotFoundObjectResult>();
        
        _mockTalentService.Verify(x => x.GetByIdAsync(talentId), Times.Once);
    }
}
