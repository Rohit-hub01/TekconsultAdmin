import { useState } from "react";
import SelectPaymentMethod from "./SelectPaymentMethod";
import ConfirmWithdrawal from "./ConfirmWithdrawal";
import WithdrawalSuccess from "./WithdrawalSuccess";
import { PaymentMethod } from "./types";
import { paymentAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";

enum Step {
    SELECT_METHOD,
    CONFIRM,
    SUCCESS,
}

interface Props {
    isOpen: boolean;
    amount: number;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function WithdrawFlowModal({ isOpen, amount, onClose, onSuccess }: Props) {
    const [step, setStep] = useState(Step.SELECT_METHOD);
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSucceeded, setHasSucceeded] = useState(false);

    if (!isOpen) return null;

    const handleConfirmWithdrawal = async () => {
        setIsSubmitting(true);
        try {
            await paymentAPI.requestWithdrawal(amount);
            setHasSucceeded(true);
            setStep(Step.SUCCESS);
            onSuccess?.();
        } catch (error: any) {
            toast({
                title: "Withdrawal Failed",
                description: error.message || "Failed to process withdrawal request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset flow for next time
        setTimeout(() => {
            setStep(Step.SELECT_METHOD);
            setMethod(null);
            setHasSucceeded(false);
        }, 200);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {step === Step.SELECT_METHOD && (
                <SelectPaymentMethod
                    amount={amount}
                    selected={method}
                    onSelect={setMethod}
                    onNext={() => setStep(Step.CONFIRM)}
                    onClose={handleClose}
                />
            )}

            {step === Step.CONFIRM && method && (
                <ConfirmWithdrawal
                    amount={amount}
                    method={method}
                    onBack={() => setStep(Step.SELECT_METHOD)}
                    onConfirm={handleConfirmWithdrawal}
                    loading={isSubmitting}
                />
            )}

            {step === Step.SUCCESS && method && (
                <WithdrawalSuccess
                    amount={amount}
                    method={method}
                    onDone={handleClose}
                />
            )}
        </div>
    );
}
