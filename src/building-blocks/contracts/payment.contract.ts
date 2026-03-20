import { IEvent } from '@nestjs/cqrs';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength
} from 'class-validator';
import { ToDate, ToInteger, ToNumber, TrimmedText } from '../validation/validation.decorators';

export enum PaymentStatus {
  PENDING = 0,
  PROCESSING = 1,
  SUCCEEDED = 2,
  FAILED = 3,
  EXPIRED = 4
}

export enum RefundStatus {
  NONE = 0,
  PENDING = 1,
  SUCCEEDED = 2,
  FAILED = 3
}

export enum FakePaymentScenario {
  SUCCESS = 'SUCCESS',
  DECLINE = 'DECLINE',
  TIMEOUT = 'TIMEOUT'
}

export enum ManualReconcileResult {
  CREDITED = 'CREDITED',
  REJECTED_NOT_FOUND = 'REJECTED_NOT_FOUND',
  REJECTED_AMOUNT_MISMATCH = 'REJECTED_AMOUNT_MISMATCH',
  REJECTED_EXPIRED = 'REJECTED_EXPIRED',
  ALREADY_CREDITED = 'ALREADY_CREDITED'
}

export enum WalletTopupRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum WalletLedgerType {
  TOPUP_APPROVED = 'TOPUP_APPROVED',
  BOOKING_DEBIT = 'BOOKING_DEBIT',
  BOOKING_REFUND = 'BOOKING_REFUND'
}

export enum WalletLedgerReferenceType {
  TOPUP_REQUEST = 'TOPUP_REQUEST',
  BOOKING = 'BOOKING',
  REFUND = 'REFUND'
}

export class WalletDto {
  userId: number;
  balance: number;
  currency: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;

  constructor(partial: Partial<WalletDto> = {}) {
    Object.assign(this, partial);
  }
}

export class WalletTopupRequestDto {
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

  constructor(partial: Partial<WalletTopupRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class WalletLedgerEntryDto {
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

  constructor(partial: Partial<WalletLedgerEntryDto> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentTransferInstructionDto {
  bankName: string;
  accountName: string;
  accountNumber: string;
  amount: number;
  currency: string;
  content: string;
  expiresAt: Date;

  constructor(partial: Partial<PaymentTransferInstructionDto> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentAttemptDto {
  id: number;
  paymentId: number;
  scenario: FakePaymentScenario;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt?: Date | null;

  constructor(partial: Partial<PaymentAttemptDto> = {}) {
    Object.assign(this, partial);
  }
}

export class RefundDto {
  id: number;
  paymentId: number;
  amount: number;
  currency: string;
  refundStatus: RefundStatus;
  createdAt: Date;
  updatedAt?: Date | null;
  completedAt?: Date | null;

  constructor(partial: Partial<RefundDto> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentSummaryDto {
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

  constructor(partial: Partial<PaymentSummaryDto> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentDto extends PaymentSummaryDto {
  attempts: PaymentAttemptDto[] = [];
  refunds: RefundDto[] = [];

  constructor(partial: Partial<PaymentDto> = {}) {
    super(partial);
    Object.assign(this, partial);
  }
}

export class CreatePaymentIntentRequestDto {
  @ToInteger()
  @IsInt()
  bookingId: number;

  @ToInteger()
  @IsInt()
  userId: number;

  @ToNumber()
  @IsPositive()
  amount: number;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string;

  @ToDate()
  @IsDate()
  expiresAt: Date;

  constructor(partial: Partial<CreatePaymentIntentRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class ConfirmPaymentRequestDto {
  @IsEnum(FakePaymentScenario)
  scenario: FakePaymentScenario = FakePaymentScenario.SUCCESS;

  constructor(partial: Partial<ConfirmPaymentRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class ManualReconcilePaymentRequestDto {
  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  providerTxnId: string;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  transferContent: string;

  @ToNumber()
  @IsNumber()
  @IsPositive()
  transferredAmount: number;

  @ToDate()
  @IsDate()
  transferredAt: Date;

  constructor(partial: Partial<ManualReconcilePaymentRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class ManualReconcilePaymentResponseDto {
  @IsEnum(ManualReconcileResult)
  result: ManualReconcileResult;

  @IsOptional()
  payment?: PaymentDto | null;

  constructor(partial: Partial<ManualReconcilePaymentResponseDto> = {}) {
    Object.assign(this, partial);
  }
}

export class CreateWalletTopupRequestDto {
  @ToNumber()
  @IsInt()
  @IsPositive()
  amount: number;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  transferContent: string;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  providerTxnId: string;

  constructor(partial: Partial<CreateWalletTopupRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class ReviewWalletTopupRequestDto {
  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason: string;

  constructor(partial: Partial<ReviewWalletTopupRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class WalletPayBookingRequestDto {
  @ToInteger()
  @IsInt()
  paymentId: number;

  constructor(partial: Partial<WalletPayBookingRequestDto> = {}) {
    Object.assign(this, partial);
  }
}

export class WalletPayBookingResponseDto {
  payment: PaymentDto;
  wallet: WalletDto;

  constructor(partial: Partial<WalletPayBookingResponseDto> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentSucceeded implements IEvent {
  @ToInteger()
  @IsInt()
  paymentId: number;

  @ToInteger()
  @IsInt()
  bookingId: number;

  @ToInteger()
  @IsInt()
  userId: number;

  @ToNumber()
  @IsPositive()
  amount: number;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string;

  @ToDate()
  @IsDate()
  occurredAt: Date;

  constructor(partial: Partial<PaymentSucceeded> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentFailed implements IEvent {
  @ToInteger()
  @IsInt()
  paymentId: number;

  @ToInteger()
  @IsInt()
  bookingId: number;

  @ToInteger()
  @IsInt()
  userId: number;

  @IsEnum(FakePaymentScenario)
  scenario: FakePaymentScenario;

  @ToDate()
  @IsDate()
  occurredAt: Date;

  constructor(partial: Partial<PaymentFailed> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentExpired implements IEvent {
  @ToInteger()
  @IsInt()
  paymentId: number;

  @ToInteger()
  @IsInt()
  bookingId: number;

  @ToInteger()
  @IsInt()
  userId: number;

  @ToDate()
  @IsDate()
  occurredAt: Date;

  constructor(partial: Partial<PaymentExpired> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentRefundRequested implements IEvent {
  @ToInteger()
  @IsInt()
  paymentId: number;

  @ToInteger()
  @IsInt()
  bookingId: number;

  @ToInteger()
  @IsInt()
  userId: number;

  @ToNumber()
  @IsPositive()
  amount: number;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string;

  @IsOptional()
  @TrimmedText()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ToDate()
  @IsDate()
  requestedAt: Date;

  constructor(partial: Partial<PaymentRefundRequested> = {}) {
    Object.assign(this, partial);
  }
}

export class PaymentRefunded implements IEvent {
  @ToInteger()
  @IsInt()
  paymentId: number;

  @ToInteger()
  @IsInt()
  bookingId: number;

  @ToInteger()
  @IsInt()
  refundId: number;

  @ToInteger()
  @IsInt()
  userId: number;

  @ToNumber()
  @IsPositive()
  amount: number;

  @TrimmedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string;

  @ToDate()
  @IsDate()
  occurredAt: Date;

  constructor(partial: Partial<PaymentRefunded> = {}) {
    Object.assign(this, partial);
  }
}
