import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    User, Mail, Phone, Calendar, Star, DollarSign, Clock,
    MapPin, Shield, CheckCircle, XCircle, ChevronLeft, Save,
    History, MessageSquare, PlayCircle, FileText, AlertCircle,
    Camera, Briefcase, CreditCard, Loader2, IndianRupee, Gift
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    api,
    Consultant,
    Session,
    Review,
    ReviewDetailsDto,
    ConsultantDashboardStats,
    BackendKYCDocument,
    BackendBankDetails,
    API_BASE_URL
} from "@/lib/api";

export default function ConsultantDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [consultant, setConsultant] = useState<Consultant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [category, setCategory] = useState<string>("");
    const [status, setStatus] = useState<Consultant['status']>("Pending");
    const [isEditing, setIsEditing] = useState(false);

    const [requestChangesComment, setRequestChangesComment] = useState("");

    // Tab-wise data state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [reviews, setReviews] = useState<ReviewDetailsDto[]>([]);
    const [averageReviewRating, setAverageReviewRating] = useState<number>(0);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [stats, setStats] = useState<ConsultantDashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [kycDocuments, setKycDocuments] = useState<BackendKYCDocument[]>([]);
    const [bankDetails, setBankDetails] = useState<BackendBankDetails | null>(null);
    const [loadingKYC, setLoadingKYC] = useState(false);
    const [sessionsTotalCount, setSessionsTotalCount] = useState(0);
    const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);

    const fetchConsultant = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await api.getConsultantById(id);
            setConsultant(data);
            setCategory(data.category);
            setStatus(data.status);
        } catch (err) {
            setError("Failed to load consultant details.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchConsultant();
    }, [fetchConsultant]);

    useEffect(() => {
        if (activeTab === "sessions" && id) {
            setLoadingSessions(true);
            api.getConsultantSessionsPaginated(id, 0, 10)
                .then(data => {
                    setSessions(data.sessions);
                    setSessionsTotalCount(data.totalCount);
                })
                .catch(err => console.error("Failed to load sessions", err))
                .finally(() => setLoadingSessions(false));
        }
    }, [activeTab, id]);

    const loadMoreSessions = async () => {
        if (!id || loadingMoreSessions) return;
        setLoadingMoreSessions(true);
        try {
            const data = await api.getConsultantSessionsPaginated(id, sessions.length, 10);
            setSessions(prev => [...prev, ...data.sessions]);
            setSessionsTotalCount(data.totalCount);
        } catch (err) {
            console.error("Failed to load more sessions", err);
        } finally {
            setLoadingMoreSessions(false);
        }
    };

    useEffect(() => {
        if (activeTab === "reviews" && id) {
            setLoadingReviews(true);
            api.getConsultantReviews(id)
                .then(data => {
                    setReviews(data.reviews);
                    setAverageReviewRating(data.averageRating);
                })
                .catch(err => console.error("Failed to load reviews", err))
                .finally(() => setLoadingReviews(false));
        }
    }, [activeTab, id]);

    useEffect(() => {
        if (activeTab === "kyc" && id && consultant?.consultantProfileId) {
            setLoadingKYC(true);
            Promise.all([
                api.getKYCDocuments(consultant.consultantProfileId),
                api.getBankDetails(id)
            ])
                .then(([docs, bank]) => {
                    setKycDocuments(docs);
                    setBankDetails(bank);
                })
                .catch(err => console.error("Failed to load KYC/Bank details", err))
                .finally(() => setLoadingKYC(false));
        }
    }, [activeTab, id, consultant?.consultantProfileId]);

    const fetchStats = useCallback(async () => {
        if (!id) return;
        try {
            setLoadingStats(true);
            const data = await api.getAdvisorStats(id);
            setStats(data);
        } catch (err) {
            console.error("Failed to load advisor stats", err);
        } finally {
            setLoadingStats(false);
        }
    }, [id]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleSave = async () => {
        if (!id || !consultant) return;
        try {
            await api.updateConsultantProfile({
                userId: id, // Pass the id of the consultant being edited
                firstName: consultant.firstName,
                middleName: consultant.middleName,
                lastName: consultant.lastName,
                email: consultant.email,
                addressLine: consultant.address?.addressLine || "",
                city: consultant.address?.city || "",
                state: consultant.address?.state || "",
                zipcode: consultant.address?.zipcode || "",
                country: consultant.address?.country || "",
                bio: consultant.bio || "",
                experienceYears: consultant.experienceYears || 0,
                chatRatePerMinute: consultant.rates.chatPerMinute,
                consultantCategory: category,
                callRatePerMinute: consultant.rates.callPerMinute,
                isOnline: consultant.isOnline,
                freeMinutesOffer: consultant.freeMinutesOffer || 0
            });

            // Update status via the specific status update endpoint if it changed
            if (status !== consultant.status) {
                await api.updateConsultantStatus(id, status);
            }

            const updatedFullName = [consultant.firstName, consultant.middleName, consultant.lastName].filter(Boolean).join(' ');
            setConsultant({ ...consultant, fullName: updatedFullName, category, status });
            setIsEditing(false);
            toast({ title: "Profile Updated", description: "Consultant details have been saved successfully." });
        } catch (err) {
            console.error("Update error:", err);
            toast({ title: "Update Failed", description: "Could not save changes.", variant: "destructive" });
        }
    };

    const handleRequestChanges = async () => {
        if (!id || !consultant) return;
        try {
            const updated = await api.updateConsultantStatus(id, "request_changes");
            setConsultant(updated);
            setStatus("request_changes");
            setRequestChangesComment("");
            toast({ title: "Changes Requested", description: "Consultant has been notified to make changes." });
        } catch (err) {
            toast({ title: "Request Failed", description: "Could not request changes.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !consultant) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-xl font-semibold">{error || "Consultant not found"}</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/consultants")}>
                    Back to Consultants
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/consultants")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Consultant Details</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">Manage profile, assignments, and view history</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-auto sm:ml-auto mt-2 sm:mt-0">
                    {activeTab === "overview" && (
                        isEditing ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={handleSave} className="gap-2 bg-primary">
                                    <Save className="h-4 w-4" /> Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)} variant="outline">Edit Profile</Button>
                        )
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="w-full overflow-x-auto scrollbar-none pb-1">
                    <TabsList className="w-full justify-start sm:justify-center lg:justify-start min-w-max">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="kyc">KYC Details</TabsTrigger>
                        <TabsTrigger value="sessions">Session History</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
                    </TabsList>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Persistent Sidebar */}
                    <div className="lg:col-span-1">
                        <ConsultantProfileCard consultant={consultant} status={status} stats={stats} />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6 mt-0">
                            {/* Performance Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <Card className="border-0 shadow-sm bg-primary/5">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Star className="h-5 w-5 fill-primary" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">{stats?.averageRating || consultant.averageRating || 0}</p>
                                            <p className="text-xs text-muted-foreground">Average Rating</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm bg-success/5">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-success/10 rounded-lg text-success"><DollarSign className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">₹{stats?.totalEarnings || 0}</p>
                                            <p className="text-xs text-muted-foreground">Total Earnings</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm bg-warning/5">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-warning/10 rounded-lg text-warning"><CreditCard className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">₹{stats?.availableBalance || 0}</p>
                                            <p className="text-xs text-muted-foreground">Available Balance</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm bg-info/5">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-info/10 rounded-lg text-info"><Clock className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">{stats?.numberOfSessions || consultant.totalSessionsCompleted || 0}</p>
                                            <p className="text-xs text-muted-foreground">Total Sessions</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Professional Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Briefcase className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">{consultant.experienceYears || 0}</p>
                                            <p className="text-xs text-muted-foreground">Years Experience</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-warning/10 rounded-lg text-warning"><Gift className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">{consultant.freeMinutesOffer || 0}</p>
                                            <p className="text-xs text-muted-foreground">Free Minutes</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-accent/10 rounded-lg text-accent"><MessageSquare className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">₹{consultant.rates.chatPerMinute}</p>
                                            <p className="text-xs text-muted-foreground">Chat Rate/min</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 bg-success/10 rounded-lg text-success"><Phone className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-2xl font-bold">₹{consultant.rates.callPerMinute}</p>
                                            <p className="text-xs text-muted-foreground">Call Rate/min</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Edit Form */}
                            <Card className="border-0 shadow-card">
                                <CardHeader>
                                    <CardTitle>Professional Details</CardTitle>
                                    <CardDescription>Manage category assignments and status</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-4 sm:p-6">
                                    {isEditing && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={consultant.firstName || ""}
                                                    onChange={(e) => setConsultant({ ...consultant, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="middleName">Middle Name</Label>
                                                <Input
                                                    id="middleName"
                                                    value={consultant.middleName || ""}
                                                    onChange={(e) => setConsultant({ ...consultant, middleName: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    value={consultant.lastName || ""}
                                                    onChange={(e) => setConsultant({ ...consultant, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b pb-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="addressLine">Address Line</Label>
                                                <Input
                                                    id="addressLine"
                                                    value={consultant.address?.addressLine || ""}
                                                    onChange={(e) => setConsultant({
                                                        ...consultant,
                                                        address: { ...(consultant.address || { city: '', state: '', zipcode: '', country: '' }), addressLine: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    value={consultant.address?.city || ""}
                                                    onChange={(e) => setConsultant({
                                                        ...consultant,
                                                        address: { ...(consultant.address || { addressLine: '', state: '', zipcode: '', country: '' }), city: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    value={consultant.address?.state || ""}
                                                    onChange={(e) => setConsultant({
                                                        ...consultant,
                                                        address: { ...(consultant.address || { addressLine: '', city: '', zipcode: '', country: '' }), state: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="zipcode">Zipcode</Label>
                                                <Input
                                                    id="zipcode"
                                                    value={consultant.address?.zipcode || ""}
                                                    onChange={(e) => setConsultant({
                                                        ...consultant,
                                                        address: { ...(consultant.address || { addressLine: '', city: '', state: '', country: '' }), zipcode: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Input
                                                    id="country"
                                                    value={consultant.address?.country || ""}
                                                    onChange={(e) => setConsultant({
                                                        ...consultant,
                                                        address: { ...(consultant.address || { addressLine: '', city: '', state: '', zipcode: '' }), country: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Primary Category</Label>
                                            <Select disabled={!isEditing} value={category} onValueChange={setCategory}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Digital Marketers">Digital Marketers</SelectItem>
                                                    <SelectItem value="Interior Consultant">Interior Consultant</SelectItem>
                                                    <SelectItem value="Counsellors">Counsellors</SelectItem>
                                                    <SelectItem value="Lawyers">Lawyers</SelectItem>
                                                    <SelectItem value="Fitness Coaches">Fitness Coaches</SelectItem>
                                                    <SelectItem value="Health Consultants">Health Consultants</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {isEditing && <p className="text-xs text-muted-foreground">Assigning a new category requires approval.</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Account Status</Label>
                                            <Select disabled={!isEditing} value={status} onValueChange={(v) => setStatus(v as Consultant['status'])}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Approved">Approved</SelectItem>
                                                    <SelectItem value="Pending">Pending</SelectItem>
                                                    <SelectItem value="request_changes">Request Changes</SelectItem>
                                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4 md:col-span-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="chatRate">Chat Rate (per min)</Label>
                                                    <Input
                                                        id="chatRate"
                                                        type="number"
                                                        disabled={!isEditing}
                                                        value={consultant.rates.chatPerMinute}
                                                        onChange={(e) => setConsultant({
                                                            ...consultant,
                                                            rates: { ...consultant.rates, chatPerMinute: Number(e.target.value) }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="callRate">Call Rate (per min)</Label>
                                                    <Input
                                                        id="callRate"
                                                        type="number"
                                                        disabled={!isEditing}
                                                        value={consultant.rates.callPerMinute}
                                                        onChange={(e) => setConsultant({
                                                            ...consultant,
                                                            rates: { ...consultant.rates, callPerMinute: Number(e.target.value) }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="experience">Experience (Years)</Label>
                                                    <Input
                                                        id="experience"
                                                        type="number"
                                                        disabled={!isEditing}
                                                        value={consultant.experienceYears || 0}
                                                        onChange={(e) => setConsultant({
                                                            ...consultant,
                                                            experienceYears: Number(e.target.value)
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="freeMinutes">Free Minutes Offer</Label>
                                                    <Input
                                                        id="freeMinutes"
                                                        type="number"
                                                        disabled={!isEditing}
                                                        value={consultant.freeMinutesOffer || 0}
                                                        onChange={(e) => setConsultant({
                                                            ...consultant,
                                                            freeMinutesOffer: Number(e.target.value)
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Expertise Tags</Label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {consultant.expertise?.map(tag => (
                                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                                )) || <span className="text-xs text-muted-foreground italic">No tags added</span>}
                                                {isEditing && <Badge variant="outline" className="border-dashed cursor-pointer hover:bg-accent">+ Add Tag</Badge>}
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="bio">Bio / About</Label>
                                            {isEditing ? (
                                                <Textarea
                                                    id="bio"
                                                    value={consultant.bio || ""}
                                                    onChange={(e) => setConsultant({ ...consultant, bio: e.target.value })}
                                                    rows={4}
                                                />
                                            ) : (
                                                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                                                    {consultant.bio || "No biography provided."}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* KYC Tab */}
                        <TabsContent value="kyc" className="space-y-6 mt-0">
                            {loadingKYC ? (
                                <div className="flex h-[200px] items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    {/* STATS */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <StatCard
                                            icon={<Star className="w-5 h-5 text-gray-400" />}
                                            label="Average Rating"
                                            value={stats?.averageRating?.toString() || consultant.averageRating?.toString() || "0"}
                                        />
                                        <StatCard
                                            icon={<IndianRupee className="w-5 h-5 text-gray-400" />}
                                            label="Total Earnings"
                                            value={`₹${stats?.totalEarnings || 0}`}
                                        />
                                    </div>

                                    {/* PERSONAL INFO */}
                                    <SectionCard title="Personal Information">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                            <Info label="Full Name" value={consultant.fullName} />
                                            <Info label="Date of Birth" value={consultant.dob || "Not Available"} />
                                            <Info label="Gender" value={consultant.gender || "Not Available"} />
                                            <Info label="Email" value={consultant.email} />
                                            <Info label="Phone" value={consultant.phone || "N/A"} />
                                            <Info
                                                label="Address"
                                                value={consultant.address ? `${consultant.address.addressLine}, ${consultant.address.city}, ${consultant.address.state}, ${consultant.address.country}` : "N/A"}
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* DOCUMENTS */}
                                    <SectionCard title="Documents">
                                        <div className="space-y-3">
                                            {kycDocuments.length === 0 ? (
                                                <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg">
                                                    No KYC documents uploaded yet.
                                                </div>
                                            ) : (
                                                kycDocuments.map((doc) => (
                                                    <DocumentRow
                                                        key={doc.docId}
                                                        title={doc.documentType}
                                                        value={`Uploaded on ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                                                        status={doc.verificationStatus === 1 ? "verified" : (doc.verificationStatus === 2 ? "rejected" : "pending")}
                                                        url={doc.documentUrl}
                                                        onStatusUpdate={async (status, feedback) => {
                                                            try {
                                                                await api.updateKYCStatus(doc.docId, status, feedback);
                                                                toast({ title: "Status Updated", description: `Document marked as ${status === 1 ? 'Approved' : 'Rejected'}.` });
                                                                // Refresh documents
                                                                if (consultant?.consultantProfileId) {
                                                                    const docs = await api.getKYCDocuments(consultant.consultantProfileId);
                                                                    setKycDocuments(docs);
                                                                }
                                                            } catch (err) {
                                                                toast({ title: "Update Failed", description: "Could not update document status.", variant: "destructive" });
                                                            }
                                                        }}
                                                        feedback={doc.adminFeedback}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </SectionCard>

                                    {/* BANK DETAILS */}
                                    <SectionCard title="Bank Details">
                                        {!bankDetails ? (
                                            <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg">
                                                No bank details provided yet.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                                <Info label="Account Holder Name" value={bankDetails.accountHolderName} />
                                                <Info label="Bank Name" value={bankDetails.bankName} />
                                                <Info label="Account Number" value={bankDetails.accountNumber} />
                                                <Info label="IFSC Code" value={bankDetails.ifscCode} />
                                                <Info label="Branch" value={bankDetails.branchName || "N/A"} />
                                                <Info label="Verification Status" value={bankDetails.isVerified ? "Verified" : "Pending"} />
                                            </div>
                                        )}
                                    </SectionCard>
                                </>
                            )}
                        </TabsContent>

                        {/* Sessions Tab */}
                        <TabsContent value="sessions" className="mt-0">
                            <Card className="border-0 shadow-card">
                                <CardHeader>
                                    <CardTitle>Recent Sessions</CardTitle>
                                    <CardDescription>History of consultations and outcomes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-muted-foreground font-medium border-b">
                                                <tr>
                                                    {/* <th className="py-3 px-4">Session ID</th> */}
                                                    <th className="py-3 px-4">User</th>
                                                    <th className="py-3 px-4">Date & Time</th>
                                                    <th className="py-3 px-4">Type</th>
                                                    <th className="py-3 px-4">Duration</th>
                                                    <th className="py-3 px-4">Amount</th>
                                                    <th className="py-3 px-4">Rating</th>
                                                    <th className="py-3 px-4">Status</th>
                                                    {/* <th className="py-3 px-4 text-right">Actions</th> */}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {loadingSessions ? (
                                                    <tr>
                                                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                            Loading sessions...
                                                        </td>
                                                    </tr>
                                                ) : sessions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                                            No sessions found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    sessions.map(session => (
                                                        <tr key={session.id} className="hover:bg-muted/50">
                                                            {/* <td className="py-3 px-4 font-mono">{session.id.slice(0, 8)}...</td> */}
                                                            <td className="py-3 px-4 font-medium">{session.user.name}</td>
                                                            <td className="py-3 px-4 text-muted-foreground">{session.startTime}</td>
                                                            <td className="py-3 px-4"><Badge variant="outline" className="capitalize">{session.mode}</Badge></td>
                                                            <td className="py-3 px-4">{session.duration}</td>
                                                            <td className="py-3 px-4 font-medium">₹{session.billed}</td>
                                                            <td className="py-3 px-4">
                                                                {session.rating ? (
                                                                    <div className="flex items-center gap-1 text-warning">
                                                                        <Star className="h-3.5 w-3.5 fill-warning" />
                                                                        <span className="font-semibold text-xs">{session.rating}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">No review</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                                    session.status === 'active' ? 'bg-success/10 text-success' :
                                                                        session.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                                            session.status === 'low_balance' ? 'bg-warning/10 text-warning' :
                                                                                'bg-secondary/50 text-secondary-foreground'
                                                                )}>
                                                                    {session.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            {/* <td className="py-3 px-4 text-right">
                                                                <Button size="sm" variant="ghost" className="h-8 gap-1">
                                                                    <History className="h-3 w-3" /> Logs
                                                                </Button>
                                                            </td> */}
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {sessions.length < sessionsTotalCount && (
                                        <div className="mt-8 flex justify-center pb-4">
                                            <Button
                                                variant="outline"
                                                onClick={loadMoreSessions}
                                                disabled={loadingMoreSessions}
                                                className="px-8"
                                            >
                                                {loadingMoreSessions ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    "Load More Sessions"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="reviews" className="mt-0 space-y-6">
                            {loadingReviews ? (
                                <div className="flex h-[200px] items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="flex h-[200px] items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                                    No reviews available for this consultant.
                                </div>
                            ) : (
                                <>
                                    {/* Rating Summary */}
                                    <div className="bg-white border rounded-xl p-6">
                                        <h3 className="text-sm font-semibold mb-4">Rating Summary</h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                                            <SummaryItem
                                                value={consultant.averageRating?.toString() || "0"}
                                                label="Average Rating"
                                                stars={5}
                                            />
                                            <SummaryItem
                                                value={reviews.length.toString()}
                                                label="Total Reviews"
                                            />
                                            <SummaryItem
                                                value={`${reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%`}
                                                label="Positive Feedback"
                                            />
                                        </div>
                                    </div>

                                    {/* Recent Reviews */}
                                    <div className="bg-white border rounded-xl">
                                        <div className="px-6 py-4 border-b">
                                            <h3 className="text-sm font-semibold">Recent Reviews</h3>
                                        </div>

                                        <div className="divide-y">
                                            {reviews.map((review, index) => (
                                                <ReviewItem key={index} review={review} />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

/* ---------- Reusable Components ---------- */

function ConsultantProfileCard({ consultant, status, stats }: { consultant: Consultant, status: string, stats: ConsultantDashboardStats | null }) {
    const isOnline = stats?.isOnline ?? consultant.isOnline;
    return (
        <Card className="border-0 shadow-card h-fit">
            <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 border-4 border-muted mb-4">
                    <AvatarImage
                        src={consultant.profilePhotoUrl ? (consultant.profilePhotoUrl.startsWith('http') ? consultant.profilePhotoUrl : `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}${consultant.profilePhotoUrl.startsWith('/') ? consultant.profilePhotoUrl : '/' + consultant.profilePhotoUrl}`) : undefined}
                        alt={consultant.fullName}
                        className="object-cover"
                    />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                        {consultant.initials}
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{consultant.fullName}</h2>
                <div className="flex items-center gap-2 mt-2">
                    {/* <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        #{consultant.id}
                    </Badge> */}
                    <Badge className={status === 'Approved' ? 'bg-success/15 text-success hover:bg-success/25 border-0' :
                        status === 'request_changes' ? 'bg-warning/15 text-warning hover:bg-warning/25 border-0' :
                            status === 'Pending' ? 'bg-warning/15 text-warning hover:bg-warning/25 border-0' :
                                'bg-destructive/15 text-destructive hover:bg-destructive/25 border-0'}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-success' : 'bg-muted-foreground'}`} />
                    <span className="text-xs text-muted-foreground">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                <Separator className="my-6" />

                <div className="w-full space-y-4 text-sm text-left">
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 shrink-0" /> Email</span>
                        <span className="font-medium underline underline-offset-4 break-all text-xs">{consultant.email}</span>
                        {consultant.isPhoneVerified && (
                            <span className="flex items-center gap-1 text-success text-xs mt-1">
                                <CheckCircle className="h-3 w-3" /> Verified
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 shrink-0" /> Phone</span>
                        <span className="font-medium text-xs">{consultant.phone || "Not provided"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 shrink-0" /> Joined</span>
                        <span className="font-medium text-xs">{consultant.appliedDate}</span>
                    </div>

                    {/* Address */}
                    {consultant.address && (
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /> Address</span>
                            <span className="font-medium text-xs">
                                {consultant.address.city}, {consultant.address.state} {consultant.address.zipcode}
                            </span>
                        </div>
                    )}

                    {/* Verification Status */}
                    {consultant.isConsultantVerified && (
                        <div className="flex items-center gap-2 pt-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-xs font-medium text-success">Consultant Verified</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-white border rounded-xl p-5 flex items-center gap-4 shadow-sm">
            {icon}
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-gray-800">{value}</p>
        </div>
    );
}

function DocumentRow({
    title,
    value,
    status,
    url,
    onStatusUpdate,
    feedback
}: {
    title: string;
    value: string;
    status: "verified" | "pending" | "rejected";
    url?: string;
    onStatusUpdate?: (status: number, feedback?: string) => Promise<void>;
    feedback?: string;
}) {
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // Robustly join API_BASE_URL and url, avoiding double slashes
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const documentUrl = url?.startsWith('/') ? url : `/${url}`;
    const fullUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${documentUrl}`) : null;

    const handleUpdate = async (newStatus: number) => {
        if (!onStatusUpdate) return;
        setIsUpdating(true);
        try {
            await onStatusUpdate(newStatus, newStatus === 2 ? rejectionReason : undefined);
            if (newStatus === 2) setShowRejectInput(false);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col bg-gray-50 rounded-lg overflow-hidden border">
            <div className="flex items-center justify-between p-4">
                <div
                    className={cn("flex-1", fullUrl ? "cursor-pointer" : "")}
                    onClick={() => fullUrl && window.open(fullUrl, '_blank')}
                >
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium hover:text-primary transition-colors">{title}</p>
                        {status === "verified" ? (
                            <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                <CheckCircle className="w-2.5 h-2.5" /> VERIFIED
                            </span>
                        ) : status === "rejected" ? (
                            <span className="flex items-center gap-1 text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-semibold uppercase">
                                <XCircle className="w-2.5 h-2.5" /> Reupload Requested
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold uppercase">
                                <Clock className="w-2.5 h-2.5" /> PENDING
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">{value}</p>
                </div>

                <div className="flex items-center gap-2">
                    {fullUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => window.open(fullUrl, '_blank')}
                        >
                            <PlayCircle className="h-3.5 w-3.5" /> View
                        </Button>
                    )}

                    {status === "pending" && (
                        <div className="flex items-center gap-2 ml-2 pl-4 border-l">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-success hover:text-success hover:bg-success/5 border-success/20"
                                onClick={() => handleUpdate(1)}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                                onClick={() => setShowRejectInput(!showRejectInput)}
                                disabled={isUpdating}
                            >
                                <AlertCircle className="h-3.5 w-3.5" />
                                Reupload
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {showRejectInput && (
                <div className="bg-destructive/5 p-4 border-t border-destructive/10 space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-destructive">Reason for Reupload / Rejection</Label>
                        <Textarea
                            placeholder="Explain why this document is being rejected (e.g. low quality, expired, wrong document)..."
                            className="text-xs min-h-[80px] bg-white border-destructive/20 focus-visible:ring-destructive"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleUpdate(2)}
                            disabled={isUpdating || !rejectionReason.trim()}
                        >
                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                            Request Reupload
                        </Button>
                    </div>
                </div>
            )}

            {status === "rejected" && feedback && (
                <div className="bg-destructive/5 p-3 border-t border-destructive/10">
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1">Feedback Provided:</p>
                    <p className="text-xs text-destructive/80 italic">"{feedback}"</p>
                </div>
            )}
        </div>
    );
}

function SummaryItem({
    value,
    label,
    stars,
}: {
    value: string;
    label: string;
    stars?: number;
}) {
    return (
        <div>
            <p className="text-3xl font-bold">{value}</p>

            {stars && (
                <div className="flex justify-center mt-1">
                    {[...Array(stars)].map((_, i) => (
                        <Star
                            key={i}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                    ))}
                </div>
            )}

            <p className="mt-2 text-xs text-gray-500">{label}</p>
        </div>
    );
}

function ReviewItem({ review }: { review: ReviewDetailsDto }) {
    return (
        <div className="px-6 py-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold">{review.userName}</p>

                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w - 4 h - 4 ${i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                        } `}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-400">
                            {review.createdAt}
                        </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                        {review.comment}
                    </p>
                </div>

                {review.sessionId && (
                    <span className="text-xs text-gray-400 hidden sm:block">
                        Session: {review.sessionId}
                    </span>
                )}
            </div>
        </div>
    );
}
