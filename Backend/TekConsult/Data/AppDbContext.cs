using Microsoft.EntityFrameworkCore;
using TekConsult.Dto;
using TekConsult.Entities;

namespace TekConsult.Data
{
    public class AppDbContext: DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Users> Users { get; set; }
        public DbSet<Roles> Roles { get; set; }
        public DbSet<Addresses> Addresses { get; set; }
        public DbSet<ConsultantProfiles> ConsultantProfiles { get; set; }
        public DbSet<Categories> Categories { get; set; }
        public DbSet<ConsultantCategories> ConsultantCategories { get; set; }
        public DbSet<ConsultantSubCategories> ConsultantSubCategories { get; set; }
        public DbSet<ConsultantBankDetails> ConsultantBankDetails { get; set; }
        public DbSet<KYCDocuments> KYCDocuments { get; set; }
        public DbSet<Wallets> Wallets { get; set; }
        public DbSet<Transactions> Transactions { get; set; }
        public DbSet<PaymentGateways> PaymentGateways { get; set; }
        public DbSet<WithdrawalRequests> WithdrawalRequests { get; set; }
        public DbSet<ConsultationSessions> ConsultationSessions { get; set; }
        public DbSet<SessionBillingTicks> SessionBillingTicks { get; set; }
        public DbSet<ChatMessages> ChatMessages { get; set; }
        public DbSet<Reviews> Reviews { get; set; }
        public DbSet<Notifications> Notifications { get; set; }
        public DbSet<AuditLogs> AuditLogs { get; set; }
        public DbSet<UserPaymentMethods> UserPaymentMethods { get; set; }
        public DbSet<AdminUserListSpDto> AdminUserListSpDto { get; set; }
        public DbSet<SessionParticipants> SessionParticipants { get; set; }
        public DbSet<Conversations> Conversations { get; set; }
        public DbSet<SystemSettings> SystemSettings { get; set; }
        public DbSet<NotificationSettings> NotificationSettings { get; set; }

        public DbSet<Disputes> Disputes { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AdminUserListSpDto>().HasNoKey();

            modelBuilder.Entity<ConsultantCategories>()
                .HasKey(cc => new { cc.ConsultantProfileId, cc.CategoryId });

            modelBuilder.Entity<ConsultantSubCategories>()
                .HasKey(csc => new { csc.ConsultantProfileId, csc.SubCategoryId });
        }

    }
}
