import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Users, MoreHorizontal, Eye, Ban, Wallet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api, getUsersFromBackend, type User, API_BASE_URL } from "@/lib/api";
import UserDetailsModal from "@/components/users/UserDetailsModal";
import SuspendUserModal from "@/components/users/SuspendUserModal";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from backend API
      const data = await getUsersFromBackend(0, 100);

      // Apply client-side search filtering
      let filtered = data;

      if (statusFilter !== "all") {
        filtered = filtered.filter(u => u.status === statusFilter);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(u =>
          u.fullName.toLowerCase().includes(query) ||
          u.phone.includes(query)
        );
      }
      setUsers(filtered);
    } catch (err) {
      setError("Failed to load users data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleUpdateStatus = async (id: string | number, status: User['status']) => {
    const previousUsers = [...users];
    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));

    try {
      await api.updateUserStatus(id, status);
      toast.success(`User ${status === 'Active' ? 'Unblocked' : 'Blocked'}`, {
        description: `User status has been updated to ${status}.`
      });
    } catch (error) {
      setUsers(previousUsers); // Revert on failure
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleSuspendUser = async (id: string | number) => {
    try {
      await api.suspendUser(id);
      toast.success("User account suspended", {
        description: "The user has been deactivated and will be restricted from platform access."
      });
      setIsSuspendModalOpen(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Failed to suspend user");
    }
  };

  const handleReactivateUser = async (id: string | number) => {
    try {
      await api.reactivateUser(id);
      toast.success("User account reactivated", {
        description: "The user can now access the platform normally."
      });
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error reactivating user:", error);
      toast.error("Failed to reactivate user");
    }
  };

  return (
    <div className="space-y-6">
      {/* ... existing header and stats cards ... */}

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-0"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50 border-0">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-card overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            All Users
            {!isLoading && (
              <Badge variant="secondary" className="ml-2">
                {users.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Fetching users...</p>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>{error}</p>
              <Button variant="ghost" className="mt-2 underline" onClick={fetchUsers}>Retry</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground italic">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <p>No users found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Location</th>
                    <th>Wallet</th>
                    <th>Sessions</th>
                    <th>Total Spend</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-muted shadow-sm">
                            <AvatarImage
                              src={user.profilePhotoUrl ? (user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}${user.profilePhotoUrl.startsWith('/') ? user.profilePhotoUrl : '/' + user.profilePhotoUrl}`) : undefined}
                              alt={user.fullName}
                            />
                            <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground/90">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        <div className="flex flex-col">
                          <span>{user.location.city}</span>
                          <span className="text-[10px] uppercase tracking-wider opacity-70">{user.location.state}</span>
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          "font-bold",
                          user.walletBalance < 100 ? "text-destructive" :
                            user.walletBalance < 500 ? "text-warning" : "text-success"
                        )}>
                          ₹{user.walletBalance.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <Badge variant="outline" className="font-mono">
                          {user.totalSessions}
                        </Badge>
                      </td>
                      <td className="font-bold text-foreground/80">₹{user.totalSpend.toLocaleString()}</td>
                      <td>
                        <span className={cn(
                          "status-badge",
                          user.status === "Active" ? "status-active" : "status-rejected"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground text-xs font-medium">{user.joinedDate}</td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted font-bold">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 shadow-lg border-muted/50">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={cn(
                                "gap-2 cursor-pointer",
                                user.status === 'Active' ? "text-destructive focus:text-destructive focus:bg-destructive/5" : ""
                              )}
                              onClick={() => {
                                if (user.status === 'Active') {
                                  setSelectedUser(user);
                                  setIsSuspendModalOpen(true);
                                } else {
                                  handleReactivateUser(user.id);
                                }
                              }}
                            >
                              {user.status === 'Active' ? (
                                <>
                                  <Ban className="h-4 w-4" /> Suspend User
                                </>
                              ) : (
                                <>
                                  <Users className="h-4 w-4" /> Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailsModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        userId={selectedUser?.id || null}
      />

      <SuspendUserModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        user={selectedUser}
        onConfirm={handleSuspendUser}
      />
    </div>
  );
}
