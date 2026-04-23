using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TekConsult.Services
{
    public interface IEmailOtpService
    {
        Task SendOtpEmailAsync(string toEmail, string otp);
    }

    public class GraphEmailService : IEmailOtpService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<GraphEmailService> _logger;
        private readonly string _tenantId;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _senderUserId;

        public GraphEmailService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<GraphEmailService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;

            _tenantId = configuration["AzureAD:tenantId"]
                ?? configuration["AzureAD:TenantId"]
                ?? configuration["GraphApi:TenantId"]
                ?? string.Empty;

            _clientId = configuration["AzureAD:clientId"]
                ?? configuration["AzureAD:ClientId"]
                ?? configuration["GraphApi:ClientId"]
                ?? string.Empty;

            _clientSecret = configuration["AzureAD:clientSecret"]
                ?? configuration["AzureAD:ClientSecret"]
                ?? configuration["GraphApi:ClientSecret"]
                ?? string.Empty;

            _senderUserId = configuration["AzureAD:senderUserId"]
                ?? configuration["AzureAD:SenderUserId"]
                ?? configuration["GraphApi:SenderUserId"]
                ?? string.Empty;
        }

        public async Task SendOtpEmailAsync(string toEmail, string otp)
        {
            if (string.IsNullOrWhiteSpace(_tenantId) ||
                string.IsNullOrWhiteSpace(_clientId) ||
                string.IsNullOrWhiteSpace(_clientSecret) ||
                string.IsNullOrWhiteSpace(_senderUserId))
            {
                throw new InvalidOperationException("Graph API email configuration is incomplete. Please set AzureAD:clientId, AzureAD:clientSecret, AzureAD:tenantId, and AzureAD:senderUserId.");
            }

            var accessToken = await GetAccessTokenAsync();

            var payload = new
            {
                message = new
                {
                    subject = "TekConsult OTP Verification",
                    body = new
                    {
                        contentType = "Text",
                        content = $"Your TekConsult OTP is {otp}. It will expire in 5 minutes."
                    },
                    toRecipients = new[]
                    {
                        new
                        {
                            emailAddress = new
                            {
                                address = toEmail
                            }
                        }
                    }
                },
                saveToSentItems = false
            };

            var json = JsonSerializer.Serialize(payload);
            var request = new HttpRequestMessage(HttpMethod.Post, $"https://graph.microsoft.com/v1.0/users/{Uri.EscapeDataString(_senderUserId)}/sendMail")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var client = _httpClientFactory.CreateClient();
            var response = await client.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send OTP email via Graph API. Status: {Status}. Error: {Error}", response.StatusCode, error);
                throw new InvalidOperationException("Failed to send OTP email.");
            }
        }

        private async Task<string> GetAccessTokenAsync()
        {
            var tokenUrl = $"https://login.microsoftonline.com/{_tenantId}/oauth2/v2.0/token";

            var form = new Dictionary<string, string>
            {
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["scope"] = "https://graph.microsoft.com/.default",
                ["grant_type"] = "client_credentials"
            };

            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
            {
                Content = new FormUrlEncodedContent(form)
            };

            var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to get Graph API token. Status: {Status}. Error: {Error}", response.StatusCode, content);
                throw new InvalidOperationException("Unable to acquire Graph API token.");
            }

            using var doc = JsonDocument.Parse(content);
            if (!doc.RootElement.TryGetProperty("access_token", out var tokenElement))
            {
                throw new InvalidOperationException("Graph API token response missing access_token.");
            }

            return tokenElement.GetString() ?? throw new InvalidOperationException("Graph API access_token is empty.");
        }
    }
}
