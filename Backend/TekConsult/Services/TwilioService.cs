using System.Runtime.InteropServices;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace TekConsult.Services
{
    public interface ITwilioService
    {
        Task SendOtpAsync(string phoneNumber, string otp);
    }

    public class TwilioService : ITwilioService
    {
        private readonly string _accountSid;
        private readonly string _authToken;
        private readonly string _fromNumber;
        private readonly ILogger<TwilioService> _logger;

        public TwilioService(IConfiguration config, ILogger<TwilioService> logger)
        {
            _logger = logger;
            _accountSid = config["Twilio:AccountSid"];
            _authToken = config["Twilio:AuthToken"];
            _fromNumber = config["Twilio:FromPhoneNumber"];

            // Validate credentials
            if (string.IsNullOrWhiteSpace(_accountSid) || string.IsNullOrWhiteSpace(_authToken))
            {
                _logger.LogError("Twilio credentials are not configured properly. AccountSid or AuthToken is missing.");
                throw new InvalidOperationException("Twilio credentials are not configured. Please check appsettings.json");
            }

            if (string.IsNullOrWhiteSpace(_fromNumber))
            {
                _logger.LogError("Twilio FromPhoneNumber is not configured.");
                throw new InvalidOperationException("Twilio FromPhoneNumber is not configured. Please check appsettings.json");
            }

            try
            {
                TwilioClient.Init(_accountSid, _authToken);
                _logger.LogInformation("Twilio client initialized successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to initialize Twilio client: {ex.Message}");
                throw;
            }
        }

        public async Task SendOtpAsync(string phoneNumber, string otp)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(phoneNumber))
                {
                    _logger.LogWarning("SendOtpAsync called with empty phone number.");
                    throw new ArgumentException("Phone number cannot be empty.", nameof(phoneNumber));
                }

                _logger.LogInformation($"Attempting to send OTP to {phoneNumber}");

                var message = await MessageResource.CreateAsync(
                    body: $"Use {otp} as your TekConsult OTP to complete verification. This code is valid for one-time use only.",
                    from: new Twilio.Types.PhoneNumber(_fromNumber),
                    to: new Twilio.Types.PhoneNumber(phoneNumber)
                );

                _logger.LogInformation($"OTP sent successfully to {phoneNumber}. Message SID: {message.Sid}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send OTP to {phoneNumber}: {ex.GetType().Name} - {ex.Message}");
                throw;
            }
        }
    }
}
