using AutoFixture;
using AutoFixture.AutoMoq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Pregiato.API.Controllers;
using Pregiato.Application.DTOs;
using Pregiato.Application.Interfaces;
using Xunit;

namespace Pregiato.Application.Tests.Controllers
{
    public class LeadsControllerTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<ILeadService> _mockLeadService;
        private readonly LeadsController _controller;

        public LeadsControllerTests()
        {
            _fixture = new Fixture();
            _fixture.Customize(new AutoMoqCustomization());
            
            // Configurar AutoFixture para lidar com referências circulares
            _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => _fixture.Behaviors.Remove(b));
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            _mockLeadService = new Mock<ILeadService>();
            _controller = new LeadsController(_mockLeadService.Object);
        }

        [Fact]
        public async Task GetAll_WithValidFilter_ShouldReturnOkResult()
        {
            // Arrange
            var filter = _fixture.Create<LeadFilterDto>();
            var leads = _fixture.CreateMany<LeadDto>(5);

            _mockLeadService.Setup(x => x.GetFilteredAsync(filter))
                .ReturnsAsync(leads);

            // Act
            var result = await _controller.GetAll(filter);

            // Assert
            result.Should().BeOfType<ActionResult<IEnumerable<LeadDto>>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(leads);
        }

        [Fact]
        public async Task GetAll_WhenServiceThrowsException_ShouldReturnInternalServerError()
        {
            // Arrange
            var filter = _fixture.Create<LeadFilterDto>();
            _mockLeadService.Setup(x => x.GetFilteredAsync(filter))
                .ThrowsAsync(new Exception("Test error"));

            // Act
            var result = await _controller.GetAll(filter);

            // Assert
            result.Should().BeOfType<ActionResult<IEnumerable<LeadDto>>>();
            var actionResult = result.Result as ObjectResult;
            actionResult!.StatusCode.Should().Be(500);
        }

        [Fact]
        public async Task GetById_WhenLeadExists_ShouldReturnOkResult()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var lead = _fixture.Create<LeadDto>();

            _mockLeadService.Setup(x => x.GetByIdAsync(leadId))
                .ReturnsAsync(lead);

            // Act
            var result = await _controller.GetById(leadId);

            // Assert
            result.Should().BeOfType<ActionResult<LeadDto>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(lead);
        }

        [Fact]
        public async Task GetById_WhenLeadDoesNotExist_ShouldReturnNotFound()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadService.Setup(x => x.GetByIdAsync(leadId))
                .ThrowsAsync(new ArgumentException("Lead não encontrado"));

            // Act
            var result = await _controller.GetById(leadId);

            // Assert
            result.Should().BeOfType<ActionResult<LeadDto>>();
            var actionResult = result.Result as NotFoundObjectResult;
            actionResult.Should().NotBeNull();
        }

        [Fact]
        public async Task Create_WithValidDto_ShouldReturnCreatedAtAction()
        {
            // Arrange
            var createDto = _fixture.Create<CreateLeadDto>();
            var createdLead = _fixture.Create<LeadDto>();

            _mockLeadService.Setup(x => x.CreateAsync(createDto))
                .ReturnsAsync(createdLead);

            // Act
            var result = await _controller.Create(createDto);

            // Assert
            result.Should().BeOfType<ActionResult<LeadDto>>();
            var actionResult = result.Result as CreatedAtActionResult;
            actionResult!.Value.Should().BeEquivalentTo(createdLead);
        }

        [Fact]
        public async Task Update_WithValidDto_ShouldReturnOkResult()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var updateDto = _fixture.Create<UpdateLeadDto>();
            var updatedLead = _fixture.Create<LeadDto>();

            _mockLeadService.Setup(x => x.UpdateAsync(leadId, updateDto))
                .ReturnsAsync(updatedLead);

            // Act
            var result = await _controller.Update(leadId, updateDto);

            // Assert
            result.Should().BeOfType<ActionResult<LeadDto>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(updatedLead);
        }

        [Fact]
        public async Task Delete_WhenLeadExists_ShouldReturnNoContent()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadService.Setup(x => x.DeleteAsync(leadId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(leadId);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task Delete_WhenLeadDoesNotExist_ShouldReturnNotFound()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadService.Setup(x => x.DeleteAsync(leadId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(leadId);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task UpdateStatus_WithValidStatus_ShouldReturnNoContent()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var updateStatusDto = new UpdateStatusDto { Status = "Em Contato" };

            _mockLeadService.Setup(x => x.UpdateStatusAsync(leadId, updateStatusDto.Status))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.UpdateStatus(leadId, updateStatusDto);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task AssignTo_WithValidData_ShouldReturnNoContent()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var assignToDto = new AssignToDto { AssignedTo = "João Silva" };

            _mockLeadService.Setup(x => x.AssignToAsync(leadId, assignToDto.AssignedTo))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.AssignTo(leadId, assignToDto);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task GetInteractions_WhenLeadExists_ShouldReturnOkResult()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var interactions = _fixture.CreateMany<LeadInteractionDto>(3);

            _mockLeadService.Setup(x => x.GetInteractionsAsync(leadId))
                .ReturnsAsync(interactions);

            // Act
            var result = await _controller.GetInteractions(leadId);

            // Assert
            result.Should().BeOfType<ActionResult<IEnumerable<LeadInteractionDto>>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(interactions);
        }

        [Fact]
        public async Task AddInteraction_WithValidData_ShouldReturnOkResult()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var interactionDto = _fixture.Create<CreateLeadInteractionDto>();
            var updatedLead = _fixture.Create<LeadDto>();

            _mockLeadService.Setup(x => x.AddInteractionAsync(leadId, interactionDto))
                .ReturnsAsync(updatedLead);

            // Act
            var result = await _controller.AddInteraction(leadId, interactionDto);

            // Assert
            result.Should().BeOfType<ActionResult<LeadDto>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(updatedLead);
        }

        [Fact]
        public async Task GetDashboardStats_ShouldReturnOkResult()
        {
            // Arrange
            var stats = new
            {
                TotalLeads = 100,
                NewLeads = 20,
                InContactLeads = 30,
                ProposalLeads = 25,
                WonLeads = 15,
                OverdueFollowUps = 5,
                ConversionRate = 15.0
            };

            _mockLeadService.Setup(x => x.GetDashboardStatsAsync())
                .ReturnsAsync(stats);

            // Act
            var result = await _controller.GetDashboardStats();

            // Assert
            result.Should().BeOfType<ActionResult<object>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(stats);
        }

        [Fact]
        public async Task GetFunnelData_ShouldReturnOkResult()
        {
            // Arrange
            var funnelData = new[]
            {
                new { Stage = "Novo Lead", Count = 20, Color = "bg-blue-500" },
                new { Stage = "Em Contato", Count = 30, Color = "bg-yellow-500" },
                new { Stage = "Proposta Enviada", Count = 25, Color = "bg-orange-500" },
                new { Stage = "Fechado Ganho", Count = 15, Color = "bg-green-500" }
            };

            _mockLeadService.Setup(x => x.GetFunnelDataAsync())
                .ReturnsAsync(funnelData);

            // Act
            var result = await _controller.GetFunnelData();

            // Assert
            result.Should().BeOfType<ActionResult<object>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(funnelData);
        }

        [Fact]
        public async Task GetRecentInteractions_ShouldReturnOkResult()
        {
            // Arrange
            var count = 10;
            var leads = _fixture.CreateMany<LeadDto>(count);

            _mockLeadService.Setup(x => x.GetRecentInteractionsAsync(count))
                .ReturnsAsync(leads);

            // Act
            var result = await _controller.GetRecentInteractions(count);

            // Assert
            result.Should().BeOfType<ActionResult<IEnumerable<LeadDto>>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(leads);
        }

        [Fact]
        public async Task GetLeadsFromMeta_ShouldReturnOkResult()
        {
            // Arrange
            var leads = _fixture.CreateMany<LeadDto>(5);

            _mockLeadService.Setup(x => x.GetLeadsFromMetaAsync())
                .ReturnsAsync(leads);

            // Act
            var result = await _controller.GetLeadsFromMeta();

            // Assert
            result.Should().BeOfType<ActionResult<IEnumerable<LeadDto>>>();
            var actionResult = result.Result as OkObjectResult;
            actionResult!.Value.Should().BeEquivalentTo(leads);
        }

        [Fact]
        public async Task SyncWithMeta_WhenLeadExists_ShouldReturnNoContent()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadService.Setup(x => x.SyncWithMetaAsync(leadId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.SyncWithMeta(leadId);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task SyncWithMeta_WhenLeadDoesNotExist_ShouldReturnNotFound()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadService.Setup(x => x.SyncWithMetaAsync(leadId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.SyncWithMeta(leadId);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }
} 