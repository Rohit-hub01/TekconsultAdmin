
export interface DiscountInfo {
    isDiscountActive?: boolean;
    discountStart?: string | Date;
    discountEnd?: string | Date;
    discountedRate?: number;
}

export function isDiscountApplicable(info: DiscountInfo): boolean {
    if (!info.isDiscountActive || info.discountedRate === undefined || info.discountedRate === null) {
        return false;
    }

    const now = new Date();

    if (info.discountStart) {
        const start = new Date(info.discountStart);
        if (now < start) return false;
    }

    if (info.discountEnd) {
        const end = new Date(info.discountEnd);
        if (now > end) return false;
    }

    return true;
}

export function getEffectiveRate(normalRate: number, info: DiscountInfo): number {
    if (isDiscountApplicable(info)) {
        return info.discountedRate!;
    }
    return normalRate;
}
