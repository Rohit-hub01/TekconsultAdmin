import { TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Consultant } from "@/lib/api";

interface TopConsultantsTableProps {
  consultants: Consultant[];
}

export function TopConsultantsTable({ consultants }: TopConsultantsTableProps) {
  const topConsultants = consultants
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 5);

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4 text-accent" />
            Top Consultants
          </CardTitle>
          <p className="text-sm text-muted-foreground">By average rating</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {topConsultants.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No consultant data available
            </div>
          ) : topConsultants.map((consultant, index) => (
            <div key={consultant.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <Avatar className="h-10 w-10 border-2 border-accent/20">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {consultant.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{consultant.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {consultant.category} • {consultant.totalSessionsCompleted || 0} sessions
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-sm font-semibold text-accent">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {consultant.averageRating ? consultant.averageRating.toFixed(1) : "N/A"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
