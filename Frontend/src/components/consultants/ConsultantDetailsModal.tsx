import * as React from "react"
import { api, Consultant, API_BASE_URL } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import {
    X, Mail, Phone, MapPin, Calendar,
    MessageSquare, PhoneCall, Loader2,
    AlertCircle
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ConsultantDetailsModalProps {
    consultantId: string | number | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function ConsultantDetailsModal({
    consultantId,
    isOpen,
    onOpenChange,
}: ConsultantDetailsModalProps) {
    const [consultant, setConsultant] = React.useState<Consultant | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        if (isOpen && consultantId) {
            fetchConsultantDetails()
        } else if (!isOpen) {
            setConsultant(null)
        }
    }, [isOpen, consultantId])

    const fetchConsultantDetails = async () => {
        try {
            setIsLoading(true)
            const data = await api.getConsultantById(consultantId!)
            setConsultant(data)
        } catch (error) {
            console.error("Error fetching consultant details:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e5e7eb;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #d1d5db;
                    }
                `}</style>

                <DialogHeader className="px-4 sm:px-6 py-4 border-b flex flex-row items-center justify-between space-y-0 text-left">
                    <DialogTitle className="text-lg font-semibold">Consultant Details</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 custom-scrollbar min-h-[300px]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-3 pt-10">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                            <p className="text-sm text-muted-foreground">Loading consultant details...</p>
                        </div>
                    ) : consultant ? (
                        <>
                            {/* Profile Section */}
                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg shadow-sm shrink-0">
                                    <AvatarImage
                                        src={consultant.profilePhotoUrl ? (consultant.profilePhotoUrl.startsWith('http') ? consultant.profilePhotoUrl : `${API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL}${consultant.profilePhotoUrl.startsWith('/') ? consultant.profilePhotoUrl : '/' + consultant.profilePhotoUrl}`) : undefined}
                                        alt={consultant.fullName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-lg bg-teal-500 text-white text-lg sm:text-xl font-semibold">
                                        {(consultant.fullName || "").split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="text-left min-w-0">
                                    <h3 className="text-base sm:text-lg font-semibold truncate">{consultant.fullName}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge
                                            variant={consultant.status === 'Approved' ? 'default' : 'destructive'}
                                            className={cn(
                                                "capitalize text-[10px] sm:text-xs",
                                                consultant.status === 'Approved' && "bg-success text-success-foreground hover:bg-success/80",
                                                consultant.status === 'Pending' && "bg-blue-100 text-blue-600 hover:bg-blue-200 border-none",
                                                consultant.status === 'Suspended' && "bg-orange-100 text-orange-600 hover:bg-orange-200 border-none"
                                            )}
                                        >
                                            {consultant.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] sm:text-xs text-blue-600 bg-blue-50 border-blue-200">
                                            {consultant.category}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs font-medium text-warning bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                            <span>⭐</span>
                                            <span>{consultant.averageRating ? consultant.averageRating.toFixed(1) : 'New'}</span>
                                            <span className="text-muted-foreground font-normal ml-0.5">({consultant.totalSessionsCompleted || 0})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="text-left">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                    Contact Information
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                    <div className="flex gap-3 items-center min-w-0">
                                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="text-muted-foreground truncate">{consultant.email}</span>
                                    </div>

                                    <div className="flex gap-3 items-center min-w-0">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="text-muted-foreground truncate">{consultant.phone || "Not provided"}</span>
                                    </div>

                                    <div className="flex gap-3 items-center min-w-0">
                                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="text-muted-foreground truncate">
                                            {consultant.kyc?.address?.split(',').slice(-2).join(', ') || "Location not set"}
                                        </span>
                                    </div>

                                    <div className="flex gap-3 items-center min-w-0">
                                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="text-muted-foreground truncate">
                                            Joined {new Date(consultant.appliedDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="text-left">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Pricing</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <MessageSquare className="w-4 h-4 text-teal-600" />
                                            Chat Rate
                                        </div>
                                        <p className="mt-1 text-base sm:text-lg font-semibold">₹{consultant.rates?.chatPerMinute || 0}/min</p>
                                    </div>

                                    <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <PhoneCall className="w-4 h-4 text-teal-600" />
                                            Call Rate
                                        </div>
                                        <p className="mt-1 text-base sm:text-lg font-semibold">₹{consultant.rates?.callPerMinute || 0}/min</p>
                                    </div>
                                </div>
                            </div>

                            {/* About */}
                            <div className="text-left">
                                <h4 className="text-sm font-semibold text-foreground mb-2">About</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {consultant.bio || "No biography provided."}
                                </p>
                            </div>

                            {/* Specializations */}
                            <div className="text-left">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                    Specializations
                                </h4>

                                <div className="flex flex-wrap gap-2">
                                    {(consultant.expertise || []).length > 0 ? (
                                        consultant.expertise!.map((item) => (
                                            <Badge
                                                key={item}
                                                variant="secondary"
                                                className="px-3 py-1 text-xs font-normal bg-teal-50 text-teal-700 border-teal-200"
                                            >
                                                {item}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">No specializations listed</span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-3 pt-10">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-destructive">Failed to load consultant data.</p>
                            <Button variant="outline" size="sm" onClick={fetchConsultantDetails}>
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-4 sm:px-6 py-4 border-t flex flex-row gap-2 sm:gap-3">
                    <DialogClose asChild>
                        <Button variant="outline" className="flex-1 text-xs sm:text-sm bg-gray-50">
                            Close
                        </Button>
                    </DialogClose>
                    <Button
                        className="flex-1 text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => {
                            if (consultant) {
                                navigate(`/consultants/${consultant.id}`)
                                onOpenChange(false)
                            }
                        }}
                    >
                        View Profile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
