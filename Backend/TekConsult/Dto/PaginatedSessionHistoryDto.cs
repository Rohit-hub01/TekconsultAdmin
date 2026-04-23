using System;
using System.Collections.Generic;
using TekConsult.Dto;

namespace TekConsult.Dto
{
    public class PaginatedSessionHistoryDto
    {
        public List<SessionHistoryDto> Sessions { get; set; } = new List<SessionHistoryDto>();
        public int TotalCount { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
