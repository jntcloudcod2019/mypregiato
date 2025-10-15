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

        // Training mappings
        CreateMap<TrainingCourse, TrainingCourseDto>();
        CreateMap<CreateTrainingCourseDto, TrainingCourse>();
        CreateMap<UpdateTrainingCourseDto, TrainingCourse>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<TrainingLesson, TrainingLessonDto>();
        CreateMap<CreateTrainingLessonDto, TrainingLesson>()
            .ForMember(dest => dest.VideoSize, opt => opt.MapFrom(src => src.VideoFileSize ?? 0))
            .ForMember(dest => dest.VideoDurationSeconds, opt => opt.MapFrom(src => src.DurationSeconds))
            .ForMember(dest => dest.VideoMimeType, opt => opt.MapFrom(src => src.VideoMimeType ?? "video/mp4"))
            .ForMember(dest => dest.VideoUrl, opt => opt.MapFrom(src => src.VideoUrl ?? string.Empty))
            .ForMember(dest => dest.VideoObjectName, opt => opt.MapFrom(src => src.VideoObjectName ?? string.Empty))
            .ForMember(dest => dest.AttachmentsJson, opt => opt.MapFrom(src => src.AttachmentsJson))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CourseId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Course, opt => opt.Ignore())
            .ForMember(dest => dest.ProgressRecords, opt => opt.Ignore());
        CreateMap<UpdateTrainingLessonDto, TrainingLesson>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<TrainingEnrollment, TrainingEnrollmentDto>();
        CreateMap<CreateTrainingEnrollmentDto, TrainingEnrollment>();

        CreateMap<TrainingLessonProgress, TrainingLessonProgressDto>();

        CreateMap<TrainingRating, TrainingRatingDto>();
        CreateMap<CreateTrainingRatingDto, TrainingRating>();

        CreateMap<TrainingCertificate, TrainingCertificateDto>();
    }
} 