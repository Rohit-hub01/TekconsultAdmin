import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import { Phone } from 'lucide-react';

interface VoiceCallManagerProps {
    appId: string;
    channel: string;
    token: string;
    uid: string;
    onCallEnded?: () => void;
    onConnectionStateChange?: (state: string) => void;
}

const VoiceCallManager: React.FC<VoiceCallManagerProps> = ({
    appId,
    channel,
    token,
    uid,
    onCallEnded,
    onConnectionStateChange
}) => {
    const [client, setClient] = useState<IAgoraRTCClient | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    const clientRef = useRef<IAgoraRTCClient | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                clientRef.current = agoraClient;
                setClient(agoraClient);

                agoraClient.on('user-published', async (user, mediaType) => {
                    await agoraClient.subscribe(user, mediaType);
                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                });

                agoraClient.on('user-unpublished', (user) => {
                    console.log('User left call:', user.uid);
                });

                agoraClient.on('connection-state-change', (curState) => {
                    onConnectionStateChange?.(curState);
                });

                // Join channel
                // Note: uid must be a number or string. If it's a GUID, Agora might have issues, 
                // but we'll try to pass it as string or hash it.
                // For safety, let's use a numeric hash if it's a string GUID.
                const numericUidPart = uid.split('-').join('').slice(0, 8);
                const numericUid = parseInt(numericUidPart, 16).toString(); // Convert hex prefix to decimal string for consistency with backend

                await agoraClient.join(appId, channel, token, numericUid);

                // Create and publish local audio track
                const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
                setLocalAudioTrack(localTrack);
                await agoraClient.publish(localTrack);

                console.log('Voice call joined successfully');
            } catch (error) {
                console.error('Failed to join voice call:', error);
            }
        };

        init();

        return () => {
            const leave = async () => {
                localAudioTrack?.stop();
                localAudioTrack?.close();
                if (clientRef.current) {
                    await clientRef.current.leave();
                }
            };
            leave();
        };
    }, [appId, channel, token]);

    const toggleMute = async () => {
        if (localAudioTrack) {
            await localAudioTrack.setEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Speaker control is usually handled by the device/OS for voice calls in browsers,
    // but we can simulate UI state.
    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
    };

    return (
        <div className="flex flex-col items-center justify-center py-4">
            {/* Animated Sound Wave Equalizer */}
            <div className="flex items-center gap-1.5 h-16 pointer-events-none">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-white/60 rounded-full animate-voice-bar"
                        style={{
                            height: i === 1 || i === 6 ? '40%' : i === 2 || i === 5 ? '70%' : '100%',
                            animationDelay: `${i * 0.1}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes voice-bar {
                    0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
                .animate-voice-bar {
                    animation: voice-bar 1s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default VoiceCallManager;
