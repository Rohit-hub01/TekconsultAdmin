import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "./api/endpoints";

class NotificationSignalRService {
    private connection: signalR.HubConnection | null = null;
    private onNotificationReceivedCallbacks: ((notification: any) => void)[] = [];

    async startConnection() {
        if (this.connection) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/notificationHub`, {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.on("ReceiveNotification", (notification) => {
            this.onNotificationReceivedCallbacks.forEach((cb) => cb(notification));
        });

        try {
            await this.connection.start();
            console.log("SignalR Notification Connection Started");
        } catch (err) {
            console.error("SignalR Notification Connection Error: ", err);
            setTimeout(() => this.startConnection(), 5000);
        }
    }

    onNotificationReceived(callback: (notification: any) => void) {
        this.onNotificationReceivedCallbacks.push(callback);
        return () => {
            this.onNotificationReceivedCallbacks = this.onNotificationReceivedCallbacks.filter(
                (cb) => cb !== callback
            );
        };
    }

    stopConnection() {
        if (this.connection) {
            this.connection.stop();
            this.connection = null;
        }
    }
}

export const notificationSignalRService = new NotificationSignalRService();
