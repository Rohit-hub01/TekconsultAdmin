using System;
using TekConsult.Entities;

namespace TekConsult.Services
{
    public interface IPricingService
    {
        decimal GetEffectiveRate(ConsultantProfiles profile, int mode);
        bool IsDiscountApplicable(ConsultantProfiles profile, int mode);
    }

    public class PricingService : IPricingService
    {
        public decimal GetEffectiveRate(ConsultantProfiles profile, int mode)
        {
            if (profile == null) return 0;

            bool isChat = mode == 0;
            
            if (isChat)
            {
                if (IsDiscountApplicable(profile, 0))
                {
                    return profile.DiscountedChatRate ?? profile.ChatRatePerMinute;
                }
                return profile.ChatRatePerMinute;
            }
            else // Call
            {
                if (IsDiscountApplicable(profile, 1))
                {
                    return profile.DiscountedCallRate ?? profile.CallRatePerMinute;
                }
                return profile.CallRatePerMinute;
            }
        }

        public bool IsDiscountApplicable(ConsultantProfiles profile, int mode)
        {
            if (profile == null) return false;

            bool isChat = mode == 0;
            bool isActive = isChat ? profile.IsChatDiscountActive : profile.IsCallDiscountActive;
            decimal? discountedRate = isChat ? profile.DiscountedChatRate : profile.DiscountedCallRate;

            if (!isActive || !discountedRate.HasValue) return false;

            // Check date range if provided
            if (profile.DiscountStart.HasValue && DateTime.UtcNow < profile.DiscountStart.Value)
                return false;

            if (profile.DiscountEnd.HasValue && DateTime.UtcNow > profile.DiscountEnd.Value)
                return false;

            return true;
        }
    }
}
