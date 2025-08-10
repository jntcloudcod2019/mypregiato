using AutoMapper;
using Pregiato.Application.DTOs;
using Pregiato.Core.Entities;

namespace Pregiato.Application.Mappings;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // Talent mappings
        CreateMap<Talent, TalentDto>();
        CreateMap<CreateTalentDto, Talent>();
        CreateMap<UpdateTalentDto, Talent>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Contract mappings
        CreateMap<Contract, ContractDto>();
        CreateMap<CreateContractDto, Contract>();
        CreateMap<UpdateContractDto, Contract>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // ContractTemplate mappings
        CreateMap<ContractTemplate, ContractTemplateDto>();
        CreateMap<CreateContractTemplateDto, ContractTemplate>();

        // FileUpload mappings
        CreateMap<FileUpload, FileUploadDto>();
        CreateMap<CreateFileUploadDto, FileUpload>();

        // User mappings
        CreateMap<User, UserDto>();
        CreateMap<CreateUserDto, User>();
        CreateMap<UpdateUserDto, User>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // CRM mappings
        CreateMap<Lead, LeadDto>();
        CreateMap<CreateLeadDto, Lead>();
        CreateMap<UpdateLeadDto, Lead>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<LeadInteraction, LeadInteractionDto>();
        CreateMap<CreateLeadInteractionDto, LeadInteraction>();
        CreateMap<UpdateLeadInteractionDto, LeadInteraction>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<CrmTask, TaskDto>();
        CreateMap<CreateTaskDto, CrmTask>();
        CreateMap<UpdateTaskDto, CrmTask>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
} 