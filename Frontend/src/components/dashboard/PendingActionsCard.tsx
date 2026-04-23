import { ArrowRight, UserCheck, Wallet, AlertTriangle, ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PendingActionsCardProps {
  metrics: {
    pendingWithdrawalsCount: number;
    openDisputesCount: number;
    pendingApplicationsCount: number;
    failedTransactionsCount: number;
  };
}

export function PendingActionsCard({ metrics }: PendingActionsCardProps) {
  const pendingActions = [
    {
      icon: UserCheck,
      title: "Consultant Applications",
      count: metrics.pendingApplicationsCount,
      description: "Pending approval",
      href: "/consultants?status=Pending",
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      icon: ArrowDownToLine,
      title: "Withdrawal Requests",
      count: metrics.pendingWithdrawalsCount,
      description: "Awaiting processing",
      href: "/withdrawals?status=requested",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      icon: AlertTriangle,
      title: "Open Disputes",
      count: metrics.openDisputesCount,
      description: "Require attention",
      href: "/disputes?status=open",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: Wallet,
      title: "Failed Transactions",
      count: metrics.failedTransactionsCount,
      description: "Need review",
      href: "/wallets?status=failed",
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Pending Actions</CardTitle>
        <p className="text-sm text-muted-foreground">Items requiring your attention</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingActions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="flex items-center gap-4 rounded-lg border border-border p-3 transition-all hover:border-accent hover:shadow-sm group"
          >
            <div className={`rounded-lg p-2.5 ${action.bg}`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{action.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${action.bg} ${action.color}`}>
                  {action.count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
