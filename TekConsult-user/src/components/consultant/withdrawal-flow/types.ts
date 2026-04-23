export interface PaymentMethod {
    id: string;
    type: 'BANK' | 'UPI';
    name: string;
    subtitle: string;
    isPrimary?: boolean;
}
