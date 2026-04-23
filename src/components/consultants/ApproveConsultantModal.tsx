import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Check, Loader2, X } from "lucide-react"

interface Consultant {
    id: string | number
    name: string
    email: string
    category: string
    appliedDate: string
}

interface ApproveConsultantModalProps {
    consultant: Consultant | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ApproveConsultantModal({
    consultant,
    isOpen,
    onOpenChange,
    onSuccess,
}: ApproveConsultantModalProps) {
    const [isApproving, setIsApproving] = React.useState(false);
    if (!consultant) return null;

    const handleApprove = async () => {
        try {
            setIsApproving(true);
            await api.updateConsultantStatus(consultant.id, 'Approved');
            toast.success(`${consultant.name} has been approved successfully`);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to approve consultant. Please try again.");
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-[100]" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-[101] grid w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] gap-6 border bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="flex items-center justify-center bg-success/10 p-3 rounded-full ring-8 ring-success/5">
                            <Check className="h-6 w-6 text-success" />
                        </div>

                        <div className="space-y-1 min-w-0">
                            <Dialog.Title className="text-lg sm:text-xl font-bold text-foreground truncate px-2">
                                Approve {consultant.name}?
                            </Dialog.Title>
                            <Dialog.Description className="text-xs sm:text-sm text-muted-foreground px-2">
                                This will activate their profile and allow them to start accepting consultation sessions immediately.
                            </Dialog.Description>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Profile Card */}
                        <div className="flex items-center space-x-3 sm:space-x-4 rounded-2xl border bg-muted/20 p-4 sm:p-5 transition-all hover:bg-muted/30 hover:shadow-sm">
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md ring-4 ring-cyan-500/10">
                                <span className="text-base sm:text-lg font-bold text-white shadow-sm">
                                    {consultant.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm sm:text-base truncate">{consultant.name}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{consultant.email}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                                        {consultant.category}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground truncate">
                                        Applied: {new Date(consultant.appliedDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Upon Approval List */}
                        <div className="space-y-2 pt-1 sm:pt-2">
                            <p className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">Upon approval:</p>
                            <div className="space-y-1.5">
                                {[
                                    "Profile will be visible to users",
                                    "Can start accepting consultation sessions",
                                    "Will receive email notification"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-3">
                            <Dialog.Close asChild>
                                <button
                                    className="w-full sm:w-1/2 px-4 py-2 text-xs sm:text-sm font-medium border rounded-md
                 text-destructive border-destructive hover:bg-destructive/5
                 transition-colors focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    Cancel
                                </button>
                            </Dialog.Close>

                            <button
                                onClick={handleApprove}
                                disabled={isApproving}
                                className="w-full sm:w-1/2 px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium
               hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2
               focus-visible:ring-green-500 focus-visible:ring-offset-2
               disabled:pointer-events-none disabled:opacity-50
               rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                                {isApproving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Approving
                                    </>
                                ) : (
                                    "Approve"
                                )}
                            </button>
                        </div>

                    </div>
                    <Dialog.Close className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:bg-muted p-1 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
