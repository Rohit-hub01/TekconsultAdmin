using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace TekConsult.Common
{
    public enum AgoraRole
    {
        RolePublisher = 1,
        RoleSubscriber = 2
    }

    public static class AgoraTokenBuilder
    {
        public static string BuildRrtcToken(string appId, string appCertificate, string channelName, string uid, uint expireTimestamp)
        {
            // RTC Token Version 006
            uint ts = (uint)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            uint salt = (uint)new Random().Next();

            // 1. Pack privileges
            // JoinChannel = 1, PublishAudio = 2, PublishVideo = 3, etc.
            var privileges = new Dictionary<ushort, uint>
            {
                { 1, expireTimestamp }, // kJoinChannel
                { 2, expireTimestamp }, // kPublishAudioStream
                { 3, expireTimestamp }  // kPublishVideoStream
            };

            byte[] messageRawContent = PackPrivileges(privileges);

            // 2. Generate Signature
            byte[] signature = GenerateSignature(appCertificate, appId, channelName, uid, messageRawContent);

            // 3. CRC calculation
            uint crcChannelName = Crc32.Compute(Encoding.UTF8.GetBytes(channelName));
            uint crcUid = Crc32.Compute(Encoding.UTF8.GetBytes(uid));

            // 4. Pack final content
            byte[] finalContent = PackFinal(signature, crcChannelName, crcUid, messageRawContent);

            return "006" + appId + Convert.ToBase64String(finalContent);
        }

        private static byte[] PackPrivileges(Dictionary<ushort, uint> privileges)
        {
            using (var ms = new MemoryStream())
            using (var bw = new BinaryWriter(ms))
            {
                bw.Write((ushort)privileges.Count);
                foreach (var kvp in privileges)
                {
                    bw.Write(kvp.Key);
                    bw.Write(kvp.Value);
                }
                return ms.ToArray();
            }
        }

        private static byte[] GenerateSignature(string appCertificate, string appId, string channelName, string uid, byte[] message)
        {
            using (var ms = new MemoryStream())
            using (var bw = new BinaryWriter(ms))
            {
                bw.Write(Encoding.UTF8.GetBytes(appId));
                bw.Write(Encoding.UTF8.GetBytes(channelName));
                bw.Write(Encoding.UTF8.GetBytes(uid));
                bw.Write(message);

                using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(appCertificate)))
                {
                    return hmac.ComputeHash(ms.ToArray());
                }
            }
        }

        private static byte[] PackFinal(byte[] signature, uint crcChannel, uint crcUid, byte[] message)
        {
            using (var ms = new MemoryStream())
            using (var bw = new BinaryWriter(ms))
            {
                // Pack signature with length prefix
                bw.Write((ushort)signature.Length);
                bw.Write(signature);
                
                bw.Write(crcChannel);
                bw.Write(crcUid);
                
                // Pack message with length prefix
                bw.Write((ushort)message.Length);
                bw.Write(message);
                
                return ms.ToArray();
            }
        }
    }

    public static class Crc32
    {
        private static readonly uint[] Table;

        static Crc32()
        {
            Table = new uint[256];
            uint polynomial = 0xedb88320;
            for (uint i = 0; i < 256; i++)
            {
                uint entry = i;
                for (int j = 0; j < 8; j++)
                {
                    if ((entry & 1) == 1)
                        entry = (entry >> 1) ^ polynomial;
                    else
                        entry >>= 1;
                }
                Table[i] = entry;
            }
        }

        public static uint Compute(byte[] bytes)
        {
            uint crc = 0xffffffff;
            foreach (byte b in bytes)
            {
                byte index = (byte)((crc & 0xff) ^ b);
                crc = (crc >> 8) ^ Table[index];
            }
            return ~crc;
        }
    }
}
