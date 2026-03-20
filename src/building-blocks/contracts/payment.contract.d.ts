import { IEvent } from '@nestjs/cqrs';
export declare enum PaymentStatus {
    PENDING = 0,
    PROCESSING = 1,
    SUCCEEDED = 2,
    FAILED = 3,
    EXPIRED = 4
}
export declare enum RefundStatus {
    NONE = 0,
    PENDING = 1,
    SUCCEEDED = 2,
    FAILED = 3
}
export declare enum FakePaymentScenario {
    SUCCESS = "SUCCESS",
    DECLINE = "DECLINE",
    TIMEOUT = "TIMEOUT"
}
export declare enum ManualReconcileResult {
    CREDITED = "CREDITED",
    REJECTED_NOT_FOUND = "REJECTED_NOT_FOUND",
    REJECTED_AMOUNT_MISMATCH = "REJECTED_AMOUNT_MISMATCH",
    REJECTED_EXPIRED = "REJECTED_EXPIRED",
    ALREADY_CREDITED = "ALREADY_CREDITED"
}
export declare enum WalletTopupRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum WalletLedgerType {
    TOPUP_APPROVED = "TOPUP_APPROVED",
    BOOKING_DEBIT = "BOOKING_DEBIT",
    BOOKING_REFUND = "BOOKING_REFUND"
}
export declare enum WalletLedgerReferenceType {
    TOPUP_REQUEST = "TOPUP_REQUEST",
    BOOKING = "BOOKING",
    REFUND = "REFUND"
}
export declare class WalletDto {
    userId: number;
    balance: number;
    currency: string;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    constructor(partial?: Partial<WalletDto>);
}
export declare class WalletTopupRequestDto {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    transferContent: string;
    providerTxnId: string;
    status: WalletTopupRequestStatus;
    rejectionReason?: string | null;
    reviewedBy?: number | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt?: Date | null;
    constructor(partial?: Partial<WalletTopupRequestDto>);
}
export declare class WalletLedgerEntryDto {
    id: number;
    userId: number;
    type: WalletLedgerType;
    amount: number;
    currency: string;
    balanceBefore: number;
    balanceAfter: number;
    referenceType: WalletLedgerReferenceType;
    referenceId: number;
    createdAt: Date;
    updatedAt?: Date | null;
    constructor(partial?: Partial<WalletLedgerEntryDto>);
}
export declare class PaymentTransferInstructionDto {
    bankName: string;
    accountName: string;
    accountNumber: string;
    amount: number;
    currency: string;
    content: string;
    expiresAt: Date;
    constructor(partial?: Partial<PaymentTransferInstructionDto>);
}
export declare class PaymentAttemptDto {
    id: number;
    paymentId: number;
    scenario: FakePaymentScenario;
    paymentStatus: PaymentStatus;
    createdAt: Date;
    updatedAt?: Date | null;
    constructor(partial?: Partial<PaymentAttemptDto>);
}
export declare class RefundDto {
    id: number;
    paymentId: number;
    amount: number;
    currency: string;
    refundStatus: RefundStatus;
    createdAt: Date;
    updatedAt?: Date | null;
    completedAt?: Date | null;
    constructor(partial?: Partial<RefundDto>);
}
export declare class PaymentSummaryDto {
    id: number;
    bookingId: number;
    userId: number;
    amount: number;
    currency: string;
    paymentCode?: string;
    paymentStatus: PaymentStatus;
    refundStatus: RefundStatus;
    expiresAt: Date;
    completedAt?: Date | null;
    refundedAt?: Date | null;
    providerTxnId?: string | null;
    reconciledAt?: Date | null;
    reconciledBy?: number | null;
    transferInstruction?: PaymentTransferInstructionDto | null;
    createdAt: Date;
    updatedAt?: Date | null;
    constructor(partial?: Partial<PaymentSummaryDto>);
}
export declare class PaymentDto extends PaymentSummaryDto {
    attempts: PaymentAttemptDto[];
    refunds: RefundDto[];
    constructor(partial?: Partial<PaymentDto>);
}
export declare class CreatePaymentIntentRequestDto {
    bookingId: number;
    userId: number;
    amount: number;
    currency: string;
    expiresAt: Date;
    constructor(partial?: Partial<CreatePaymentIntentRequestDto>);
}
export declare class ConfirmPaymentRequestDto {
    scenario: FakePaymentScenario;
    constructor(partial?: Partial<ConfirmPaymentRequestDto>);
}
export declare class ManualReconcilePaymentRequestDto {
    providerTxnId: string;
    transferContent: string;
    transferredAmount: number;
    transferredAt: Date;
    constructor(partial?: Partial<ManualReconcilePaymentRequestDto>);
}
export declare class ManualReconcilePaymentResponseDto {
    result: ManualReconcileResult;
    payment?: PaymentDto | null;
    constructor(partial?: Partial<ManualReconcilePaymentResponseDto>);
}
export declare class CreateWalletTopupRequestDto {
    amount: number;
    transferContent: string;
    providerTxnId: string;
    constructor(partial?: Partial<CreateWalletTopupRequestDto>);
}
export declare class ReviewWalletTopupRequestDto {
    rejectionReason: string;
    constructor(partial?: Partial<ReviewWalletTopupRequestDto>);
}
export declare class WalletPayBookingRequestDto {
    paymentId: number;
    constructor(partial?: Partial<WalletPayBookingRequestDto>);
}
export declare class WalletPayBookingResponseDto {
    payment: PaymentDto;
    wallet: WalletDto;
    constructor(partial?: Partial<WalletPayBookingResponseDto>);
}
export declare class PaymentSucceeded implements IEvent {
    paymentId: number;
    bookingId: number;
    userId: number;
    amount: number;
    currency: string;
    occurredAt: Date;
    constructor(partial?: Partial<PaymentSucceeded>);
}
export declare class PaymentFailed implements IEvent {
    paymentId: number;
    bookingId: number;
    userId: number;
    scenario: FakePaymentScenario;
    occurredAt: Date;
    constructor(partial?: Partial<PaymentFailed>);
}
export declare class PaymentExpired implements IEvent {
    paymentId: number;
    bookingId: number;
    userId: number;
    occurredAt: Date;
    constructor(partial?: Partial<PaymentExpired>);
}
export declare class PaymentRefundRequested implements IEvent {
    paymentId: number;
    bookingId: number;
    userId: number;
    amount: number;
    currency: string;
    reason?: string;
    requestedAt: Date;
    constructor(partial?: Partial<PaymentRefundRequested>);
}
export declare class PaymentRefunded implements IEvent {
    paymentId: number;
    bookingId: number;
    refundId: number;
    userId: number;
    amount: number;
    currency: string;
    occurredAt: Date;
    constructor(partial?: Partial<PaymentRefunded>);
}
