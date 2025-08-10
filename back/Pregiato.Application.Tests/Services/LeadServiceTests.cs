using AutoFixture;
using AutoFixture.AutoMoq;
using FluentAssertions;
using Moq;
using Pregiato.Application.DTOs;
using Pregiato.Application.Services;
using Pregiato.Core.Entities;
using Pregiato.Core.Interfaces;
using Xunit;

namespace Pregiato.Application.Tests.Services
{
    public class LeadServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<ILeadRepository> _mockLeadRepository;
        private readonly Mock<AutoMapper.IMapper> _mockMapper;
        private readonly LeadService _leadService;

        public LeadServiceTests()
        {
            _fixture = new Fixture();
            _fixture.Customize(new AutoMoqCustomization());
            
            // Configurar AutoFixture para lidar com referências circulares
            _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => _fixture.Behaviors.Remove(b));
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            _mockLeadRepository = new Mock<ILeadRepository>();
            _mockMapper = new Mock<AutoMapper.IMapper>();
            _leadService = new LeadService(_mockLeadRepository.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task GetByIdAsync_WhenLeadExists_ShouldReturnLeadDto()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var lead = _fixture.Create<Lead>();
            var leadDto = _fixture.Create<LeadDto>();

            _mockLeadRepository.Setup(x => x.GetByIdAsync(leadId))
                .ReturnsAsync(lead);
            _mockMapper.Setup(x => x.Map<LeadDto>(lead))
                .Returns(leadDto);

            // Act
            var result = await _leadService.GetByIdAsync(leadId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(leadDto);
            _mockLeadRepository.Verify(x => x.GetByIdAsync(leadId), Times.Once);
        }

        [Fact]
        public async Task GetByIdAsync_WhenLeadDoesNotExist_ShouldThrowArgumentException()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadRepository.Setup(x => x.GetByIdAsync(leadId))
                .ReturnsAsync((Lead?)null);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _leadService.GetByIdAsync(leadId));
        }

        [Fact]
        public async Task CreateAsync_WithValidDto_ShouldReturnCreatedLead()
        {
            // Arrange
            var createDto = _fixture.Create<CreateLeadDto>();
            var lead = _fixture.Create<Lead>();
            var leadDto = _fixture.Create<LeadDto>();

            _mockMapper.Setup(x => x.Map<Lead>(createDto))
                .Returns(lead);
            _mockLeadRepository.Setup(x => x.CreateAsync(lead))
                .ReturnsAsync(lead);
            _mockMapper.Setup(x => x.Map<LeadDto>(lead))
                .Returns(leadDto);

            // Act
            var result = await _leadService.CreateAsync(createDto);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(leadDto);
            _mockLeadRepository.Verify(x => x.CreateAsync(It.Is<Lead>(l => 
                l.CreatedAt != default)), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_WithValidDto_ShouldReturnUpdatedLead()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var updateDto = _fixture.Create<UpdateLeadDto>();
            var lead = _fixture.Create<Lead>();
            var leadDto = _fixture.Create<LeadDto>();

            _mockLeadRepository.Setup(x => x.GetByIdAsync(leadId))
                .ReturnsAsync(lead);
            _mockLeadRepository.Setup(x => x.UpdateAsync(It.IsAny<Lead>()))
                .ReturnsAsync(lead);
            _mockMapper.Setup(x => x.Map(updateDto, lead))
                .Returns(lead);
            _mockMapper.Setup(x => x.Map<LeadDto>(lead))
                .Returns(leadDto);

            // Act
            var result = await _leadService.UpdateAsync(leadId, updateDto);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(leadDto);
            _mockLeadRepository.Verify(x => x.UpdateAsync(It.Is<Lead>(l => 
                l.UpdatedAt != default)), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_WhenLeadExists_ShouldReturnTrue()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            _mockLeadRepository.Setup(x => x.DeleteAsync(leadId))
                .ReturnsAsync(true);

            // Act
            var result = await _leadService.DeleteAsync(leadId);

            // Assert
            result.Should().BeTrue();
            _mockLeadRepository.Verify(x => x.DeleteAsync(leadId), Times.Once);
        }

        [Fact]
        public async Task UpdateStatusAsync_WhenLeadExists_ShouldUpdateStatus()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var newStatus = "Em Contato";
            var lead = _fixture.Create<Lead>();

            _mockLeadRepository.Setup(x => x.GetByIdAsync(leadId))
                .ReturnsAsync(lead);
            _mockLeadRepository.Setup(x => x.UpdateAsync(It.IsAny<Lead>()))
                .ReturnsAsync(lead);

            // Act
            var result = await _leadService.UpdateStatusAsync(leadId, newStatus);

            // Assert
            result.Should().BeTrue();
            _mockLeadRepository.Verify(x => x.UpdateAsync(It.Is<Lead>(l => 
                l.Status == newStatus && l.UpdatedAt != default)), Times.Once);
        }

        [Fact]
        public async Task GetDashboardStatsAsync_ShouldReturnStats()
        {
            // Arrange
            var totalLeads = 100;
            var newLeads = 20;
            var inContactLeads = 30;
            var proposalLeads = 25;
            var wonLeads = 15;

            _mockLeadRepository.Setup(x => x.GetTotalCountAsync())
                .ReturnsAsync(totalLeads);
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Novo"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(newLeads));
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Em Contato"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(inContactLeads));
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Proposta Enviada"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(proposalLeads));
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Fechado Ganho"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(wonLeads));
            _mockLeadRepository.Setup(x => x.GetOverdueFollowUpsAsync())
                .ReturnsAsync(_fixture.CreateMany<Lead>(5));

            // Act
            var result = await _leadService.GetDashboardStatsAsync();

            // Assert
            result.Should().NotBeNull();
            // Verificar se o resultado não é nulo
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetFunnelDataAsync_ShouldReturnFunnelData()
        {
            // Arrange
            var newLeads = 20;
            var inContactLeads = 30;
            var proposalLeads = 25;
            var wonLeads = 15;

            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Novo"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(newLeads));
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Em Contato"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(inContactLeads));
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Proposta Enviada"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(proposalLeads));
            _mockLeadRepository.Setup(x => x.GetByStatusAsync("Fechado Ganho"))
                .ReturnsAsync(_fixture.CreateMany<Lead>(wonLeads));

            // Act
            var result = await _leadService.GetFunnelDataAsync();

            // Assert
            result.Should().NotBeNull();
            var funnelData = result as dynamic[];
            funnelData.Should().HaveCount(4);
        }

        [Fact]
        public async Task AddInteractionAsync_WithValidData_ShouldAddInteraction()
        {
            // Arrange
            var leadId = Guid.NewGuid();
            var interactionDto = _fixture.Create<CreateLeadInteractionDto>();
            var lead = _fixture.Create<Lead>();
            var leadDto = _fixture.Create<LeadDto>();
            var interaction = _fixture.Create<LeadInteraction>();

            _mockLeadRepository.Setup(x => x.GetByIdAsync(leadId))
                .ReturnsAsync(lead);
            _mockLeadRepository.Setup(x => x.UpdateAsync(It.IsAny<Lead>()))
                .ReturnsAsync(lead);
            _mockMapper.Setup(x => x.Map<LeadInteraction>(interactionDto))
                .Returns(interaction);
            _mockMapper.Setup(x => x.Map<LeadDto>(lead))
                .Returns(leadDto);

            // Act
            var result = await _leadService.AddInteractionAsync(leadId, interactionDto);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(leadDto);
            _mockLeadRepository.Verify(x => x.UpdateAsync(It.Is<Lead>(l => 
                l.LastContactDate != default && l.UpdatedAt != default)), Times.Once);
        }

        [Fact]
        public async Task CreateFromMetaAsync_WithValidData_ShouldCreateLeadWithMetaInfo()
        {
            // Arrange
            var createDto = _fixture.Create<CreateLeadDto>();
            var metaLeadId = "meta_123";
            var lead = _fixture.Create<Lead>();
            var leadDto = _fixture.Create<LeadDto>();

            _mockMapper.Setup(x => x.Map<Lead>(createDto))
                .Returns(lead);
            _mockLeadRepository.Setup(x => x.CreateAsync(It.IsAny<Lead>()))
                .ReturnsAsync(lead);
            _mockMapper.Setup(x => x.Map<LeadDto>(lead))
                .Returns(leadDto);

            // Act
            var result = await _leadService.CreateFromMetaAsync(createDto, metaLeadId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(leadDto);
            _mockLeadRepository.Verify(x => x.CreateAsync(It.Is<Lead>(l => 
                l.MetaLeadId == metaLeadId && 
                l.Source == "Meta Ads" && 
                l.CreatedAt != default)), Times.Once);
        }
    }
} 