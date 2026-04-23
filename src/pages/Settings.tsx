import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Shield, Percent, Clock, Bell, Database, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { api, type SystemSettings, type NotificationSettings } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [commission, setCommission] = useState<number>(20);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(500);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newConsultantApplications: true,
    disputeAlerts: true,
    withdrawalRequests: true,
    failedTransactions: true
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState<boolean>(false);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data: SystemSettings = await api.getSystemSettings();
      setCommission(data.platformCommissionPercent);
      setMinWithdrawal(data.minimumWithdrawalAmount);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load settings";
      toast({
        title: "Failed to load settings",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSystemSettings({
        platformCommissionPercent: commission,
        minimumWithdrawalAmount: minWithdrawal
      });
      toast({
        title: "Settings saved",
        description: "System settings updated successfully"
      });
      await loadSettings();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      toast({
        title: "Failed to save settings",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadNotificationSettings = async () => {
    setIsLoadingNotifications(true);
    try {
      const data = await api.getNotificationSettings();
      setNotificationSettings(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load notification settings";
      toast({
        title: "Failed to load notification settings",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsSavingNotifications(true);
    try {
      await api.updateNotificationSettings({
        newConsultantApplications: notificationSettings.newConsultantApplications,
        disputeAlerts: notificationSettings.disputeAlerts,
        withdrawalRequests: notificationSettings.withdrawalRequests,
        failedTransactions: notificationSettings.failedTransactions
      });
      toast({
        title: "Notification settings saved",
        description: "Notification preferences updated successfully"
      });
      await loadNotificationSettings();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save notification settings";
      toast({
        title: "Failed to save notification settings",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadNotificationSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
        <p className="page-description">Configure platform settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Commission */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5 text-accent" />
              Commission Settings
            </CardTitle>
            <CardDescription>Configure platform commission rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Platform Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min={0}
                max={100}
                value={commission}
                disabled={isLoading}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setCommission(Number.isNaN(nextValue) ? 0 : nextValue);
                }}
                className="max-w-[120px]"
              />
              <p className="text-xs text-muted-foreground">Applied to all consultant earnings</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount (₹)</Label>
              <Input
                id="minWithdrawal"
                type="number"
                min={0}
                value={minWithdrawal}
                disabled={isLoading}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setMinWithdrawal(Number.isNaN(nextValue) ? 0 : nextValue);
                }}
                className="max-w-[120px]"
              />
            </div>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Session Settings */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-info" />
              Session Settings
            </CardTitle>
            <CardDescription>Configure session behavior and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minBalance">Minimum Wallet Balance for Session (₹)</Label>
              <Input id="minBalance" type="number" defaultValue="50" className="max-w-[120px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowBalanceWarning">Low Balance Warning Threshold (₹)</Label>
              <Input id="lowBalanceWarning" type="number" defaultValue="100" className="max-w-[120px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input id="sessionTimeout" type="number" defaultValue="60" className="max-w-[120px]" />
            </div>
            <Button className="bg-accent hover:bg-accent/90">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-warning" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure admin notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Consultant Applications</Label>
                <p className="text-xs text-muted-foreground">Get notified on new applications</p>
              </div>
              <Switch
                checked={notificationSettings.newConsultantApplications}
                disabled={isLoadingNotifications}
                onCheckedChange={(value) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    newConsultantApplications: value
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dispute Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified on new disputes</p>
              </div>
              <Switch
                checked={notificationSettings.disputeAlerts}
                disabled={isLoadingNotifications}
                onCheckedChange={(value) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    disputeAlerts: value
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Withdrawal Requests</Label>
                <p className="text-xs text-muted-foreground">Get notified on payout requests</p>
              </div>
              <Switch
                checked={notificationSettings.withdrawalRequests}
                disabled={isLoadingNotifications}
                onCheckedChange={(value) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    withdrawalRequests: value
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Failed Transactions</Label>
                <p className="text-xs text-muted-foreground">Alert on payment failures</p>
              </div>
              <Switch
                checked={notificationSettings.failedTransactions}
                disabled={isLoadingNotifications}
                onCheckedChange={(value) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    failedTransactions: value
                  }))
                }
              />
            </div>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleNotificationSave}
              disabled={isLoadingNotifications || isSavingNotifications}
            >
              {isSavingNotifications ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-success" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Require 2FA for all admins</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Expiry</Label>
                <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="sessionExpiry">Session Expiry Time (minutes)</Label>
              <Input id="sessionExpiry" type="number" defaultValue="30" className="max-w-[120px]" />
            </div>
            <Button className="bg-accent hover:bg-accent/90">Save Changes</Button>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Info */}
      <Card className="border-0 bg-primary/5 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Audit Logging Enabled</p>
              <p className="text-sm text-muted-foreground">
                All admin actions are logged with timestamp, user, and action details for compliance and security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
