import * as React from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, X, Ban, AlertCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Consultant {
    id: string | number
    name: string
    email: string
    initials: string
    category: string
    appliedDate: string
}

interface SuspendConsultantModalProps {
    consultant: Consultant | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function SuspendConsultantModal({
    consultant,
    isOpen,
    onOpenChange,
    onSuccess,
}: SuspendConsultantModalProps) {
    const [isSuspending, setIsSuspending] = React.useState(false)
    const [duration, setDuration] = React.useState("Temporary")
    const [reason, setReason] = React.useState("")
    const [customReason, setCustomReason] = React.useState("")

    if (!consultant) return null

    const isReasonValid = reason === "Other" ? customReason.trim().length > 0 : reason.length > 0

    const handleSuspend = async () => {
        if (!isReasonValid) {
            toast.error("Please specify the reason for suspension")
            return
        }

        try {
            setIsSuspending(true)
            const finalReason = reason === "Other" ? customReason : reason
            await api.updateConsultantStatus(consultant.id, 'Suspended', finalReason, duration)
            toast.success(`${consultant.name} has been suspended successfully`)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Failed to suspend consultant. Please try again.")
        } finally {
            setIsSuspending(false)
        }
    }

    const reasons = [
        "Policy Violation",
        "Multiple user complaints",
        "Unprofessional behavior",
        "Under investigation",
        "Other"
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
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

                <DialogHeader className="p-6 pb-0 flex flex-col items-center text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <Ban className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-xl font-bold">
                            Suspend {consultant.name}?
                        </DialogTitle>
                        <DialogDescription>
                            This will temporarily or permanently block the consultant from accepting new sessions.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
                    {/* Profile Card */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-teal-500 text-white flex items-center justify-center font-semibold">
                            {consultant.initials}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{consultant.name}</p>
                            <p className="text-xs text-gray-500">{consultant.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">
                                {consultant.category}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 text-left">
                        {/* Duration */}
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-sm font-semibold">Suspension Duration *</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Temporary">Temporary</SelectItem>
                                    <SelectItem value="Permanent">Permanent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reason Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Suspension Reason</Label>
                            <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
                                {reasons.map((r) => (
                                    <div key={r} className="space-y-2">
                                        <div className={cn(
                                            "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                                            reason === r && "border-primary bg-primary/5 ring-1 ring-primary"
                                        )}>
                                            <RadioGroupItem value={r} id={r} />
                                            <Label htmlFor={r} className="flex-1 cursor-pointer font-medium">
                                                {r}
                                            </Label>
                                        </div>

                                        {r === "Other" && reason === "Other" && (
                                            <div className="px-1 animate-in slide-in-from-top-2 duration-200">
                                                <Textarea
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                    placeholder="Specify the reason for suspension..."
                                                    className="w-full min-h-[80px] resize-none"
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Effects Card */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                            <div className="text-sm text-orange-800 leading-relaxed font-medium">
                                Effects of suspension: <br />
                                <span className="text-orange-700/80 font-normal">New sessions will be blocked. Profile hidden from users. Earnings remain accessible.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t flex flex-col sm:flex-row gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-1/2 text-destructive border-destructive hover:bg-destructive/5">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleSuspend}
                        disabled={isSuspending || !isReasonValid}
                        className="w-full sm:w-1/2 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {isSuspending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Suspending...
                            </>
                        ) : (
                            "Suspend Account"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
