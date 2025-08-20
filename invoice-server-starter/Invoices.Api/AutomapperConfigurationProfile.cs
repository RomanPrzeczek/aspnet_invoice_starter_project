using AutoMapper;
using Invoices.Api.Models;
using Invoices.Data.Models;

namespace Invoices.Api;

public class AutomapperConfigurationProfile : Profile
{
    public AutomapperConfigurationProfile()
    {
        CreateMap<Person, PersonDto>()
            .ReverseMap()
            .ForMember(dest => dest.Hidden, opt => opt.Ignore())
            .ForMember(dest => dest.Purchases, opt => opt.Ignore())
            .ForMember(dest => dest.Sales, opt => opt.Ignore());

        CreateMap<InvoiceDto, Invoice>()
                    .ForMember(dest => dest.SellerId, opt => opt.MapFrom(s => s.Seller != null ? (ulong?)s.Seller.PersonId : null))  // filtering acc. relationship InvoiceDto.Seller.PersonId-> Invoice.SellerId
                    .ForMember(dest => dest.BuyerId, opt => opt.MapFrom(s => s.Buyer != null ? (ulong?)s.Buyer.PersonId : null)) // filtering acc. relationship InvoiceDto.Buyer.PersonId -> Invoice.BuyerId
                    .ForMember(dest => dest.Seller, opt => opt.Ignore()) // ignoring the object Seller, because we have its id and this is enough
                    .ForMember(dest => dest.Buyer, opt => opt.Ignore()) // ignoring the object Buyer for same reason
                    .ForMember(dest => dest.Issued, opt => opt.MapFrom(src => src.Issued.ToDateTime(TimeOnly.MinValue))) // filtering acc. relationship InvoiceDto.Issued -> Invoice.Issued
                                                                                                                         // with adjustment of format difference DateOnly for DTO and DateTime for Entity 
                    .ForMember(dest => dest.DueDate, opt => opt.MapFrom(src => src.DueDate.ToDateTime(TimeOnly.MinValue)));

        CreateMap<Invoice, InvoiceDto>()
            .ForMember(dest => dest.Seller, opt => opt.MapFrom(src => src.Seller))
            .ForMember(dest => dest.Buyer, opt => opt.MapFrom(src => src.Buyer))
            .ForMember(dest => dest.Issued, opt => opt.MapFrom(src => DateOnly.FromDateTime(src.Issued)))
            .ForMember(dest => dest.DueDate, opt => opt.MapFrom(src => DateOnly.FromDateTime(src.DueDate)));
    }
}