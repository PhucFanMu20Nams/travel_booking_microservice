"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRefunded = exports.PaymentRefundRequested = exports.PaymentExpired = exports.PaymentFailed = exports.PaymentSucceeded = exports.WalletPayBookingResponseDto = exports.WalletPayBookingRequestDto = exports.ReviewWalletTopupRequestDto = exports.CreateWalletTopupRequestDto = exports.ManualReconcilePaymentResponseDto = exports.ManualReconcilePaymentRequestDto = exports.ConfirmPaymentRequestDto = exports.CreatePaymentIntentRequestDto = exports.PaymentDto = exports.PaymentSummaryDto = exports.RefundDto = exports.PaymentAttemptDto = exports.PaymentTransferInstructionDto = exports.WalletLedgerEntryDto = exports.WalletTopupRequestDto = exports.WalletDto = exports.WalletLedgerReferenceType = exports.WalletLedgerType = exports.WalletTopupRequestStatus = exports.ManualReconcileResult = exports.FakePaymentScenario = exports.RefundStatus = exports.PaymentStatus = void 0;
const class_validator_1 = require("class-validator");
const validation_decorators_1 = require("../validation/validation.decorators");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus[PaymentStatus["PENDING"] = 0] = "PENDING";
    PaymentStatus[PaymentStatus["PROCESSING"] = 1] = "PROCESSING";
    PaymentStatus[PaymentStatus["SUCCEEDED"] = 2] = "SUCCEEDED";
    PaymentStatus[PaymentStatus["FAILED"] = 3] = "FAILED";
    PaymentStatus[PaymentStatus["EXPIRED"] = 4] = "EXPIRED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus[RefundStatus["NONE"] = 0] = "NONE";
    RefundStatus[RefundStatus["PENDING"] = 1] = "PENDING";
    RefundStatus[RefundStatus["SUCCEEDED"] = 2] = "SUCCEEDED";
    RefundStatus[RefundStatus["FAILED"] = 3] = "FAILED";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var FakePaymentScenario;
(function (FakePaymentScenario) {
    FakePaymentScenario["SUCCESS"] = "SUCCESS";
    FakePaymentScenario["DECLINE"] = "DECLINE";
    FakePaymentScenario["TIMEOUT"] = "TIMEOUT";
})(FakePaymentScenario || (exports.FakePaymentScenario = FakePaymentScenario = {}));
var ManualReconcileResult;
(function (ManualReconcileResult) {
    ManualReconcileResult["CREDITED"] = "CREDITED";
    ManualReconcileResult["REJECTED_NOT_FOUND"] = "REJECTED_NOT_FOUND";
    ManualReconcileResult["REJECTED_AMOUNT_MISMATCH"] = "REJECTED_AMOUNT_MISMATCH";
    ManualReconcileResult["REJECTED_EXPIRED"] = "REJECTED_EXPIRED";
    ManualReconcileResult["ALREADY_CREDITED"] = "ALREADY_CREDITED";
})(ManualReconcileResult || (exports.ManualReconcileResult = ManualReconcileResult = {}));
var WalletTopupRequestStatus;
(function (WalletTopupRequestStatus) {
    WalletTopupRequestStatus["PENDING"] = "PENDING";
    WalletTopupRequestStatus["APPROVED"] = "APPROVED";
    WalletTopupRequestStatus["REJECTED"] = "REJECTED";
})(WalletTopupRequestStatus || (exports.WalletTopupRequestStatus = WalletTopupRequestStatus = {}));
var WalletLedgerType;
(function (WalletLedgerType) {
    WalletLedgerType["TOPUP_APPROVED"] = "TOPUP_APPROVED";
    WalletLedgerType["BOOKING_DEBIT"] = "BOOKING_DEBIT";
    WalletLedgerType["BOOKING_REFUND"] = "BOOKING_REFUND";
})(WalletLedgerType || (exports.WalletLedgerType = WalletLedgerType = {}));
var WalletLedgerReferenceType;
(function (WalletLedgerReferenceType) {
    WalletLedgerReferenceType["TOPUP_REQUEST"] = "TOPUP_REQUEST";
    WalletLedgerReferenceType["BOOKING"] = "BOOKING";
    WalletLedgerReferenceType["REFUND"] = "REFUND";
})(WalletLedgerReferenceType || (exports.WalletLedgerReferenceType = WalletLedgerReferenceType = {}));
class WalletDto {
    userId;
    balance;
    currency;
    createdAt;
    updatedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.WalletDto = WalletDto;
class WalletTopupRequestDto {
    id;
    userId;
    amount;
    currency;
    transferContent;
    providerTxnId;
    status;
    rejectionReason;
    reviewedBy;
    reviewedAt;
    createdAt;
    updatedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.WalletTopupRequestDto = WalletTopupRequestDto;
class WalletLedgerEntryDto {
    id;
    userId;
    type;
    amount;
    currency;
    balanceBefore;
    balanceAfter;
    referenceType;
    referenceId;
    createdAt;
    updatedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.WalletLedgerEntryDto = WalletLedgerEntryDto;
class PaymentTransferInstructionDto {
    bankName;
    accountName;
    accountNumber;
    amount;
    currency;
    content;
    expiresAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentTransferInstructionDto = PaymentTransferInstructionDto;
class PaymentAttemptDto {
    id;
    paymentId;
    scenario;
    paymentStatus;
    createdAt;
    updatedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentAttemptDto = PaymentAttemptDto;
class RefundDto {
    id;
    paymentId;
    amount;
    currency;
    refundStatus;
    createdAt;
    updatedAt;
    completedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.RefundDto = RefundDto;
class PaymentSummaryDto {
    id;
    bookingId;
    userId;
    amount;
    currency;
    paymentCode;
    paymentStatus;
    refundStatus;
    expiresAt;
    completedAt;
    refundedAt;
    providerTxnId;
    reconciledAt;
    reconciledBy;
    transferInstruction;
    createdAt;
    updatedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentSummaryDto = PaymentSummaryDto;
class PaymentDto extends PaymentSummaryDto {
    attempts = [];
    refunds = [];
    constructor(partial = {}) {
        super(partial);
        Object.assign(this, partial);
    }
}
exports.PaymentDto = PaymentDto;
class CreatePaymentIntentRequestDto {
    bookingId;
    userId;
    amount;
    currency;
    expiresAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.CreatePaymentIntentRequestDto = CreatePaymentIntentRequestDto;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreatePaymentIntentRequestDto.prototype, "bookingId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreatePaymentIntentRequestDto.prototype, "userId", void 0);
__decorate([
    (0, validation_decorators_1.ToNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreatePaymentIntentRequestDto.prototype, "amount", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], CreatePaymentIntentRequestDto.prototype, "currency", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreatePaymentIntentRequestDto.prototype, "expiresAt", void 0);
class ConfirmPaymentRequestDto {
    scenario = FakePaymentScenario.SUCCESS;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.ConfirmPaymentRequestDto = ConfirmPaymentRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(FakePaymentScenario),
    __metadata("design:type", String)
], ConfirmPaymentRequestDto.prototype, "scenario", void 0);
class ManualReconcilePaymentRequestDto {
    providerTxnId;
    transferContent;
    transferredAmount;
    transferredAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.ManualReconcilePaymentRequestDto = ManualReconcilePaymentRequestDto;
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], ManualReconcilePaymentRequestDto.prototype, "providerTxnId", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ManualReconcilePaymentRequestDto.prototype, "transferContent", void 0);
__decorate([
    (0, validation_decorators_1.ToNumber)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], ManualReconcilePaymentRequestDto.prototype, "transferredAmount", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], ManualReconcilePaymentRequestDto.prototype, "transferredAt", void 0);
class ManualReconcilePaymentResponseDto {
    result;
    payment;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.ManualReconcilePaymentResponseDto = ManualReconcilePaymentResponseDto;
__decorate([
    (0, class_validator_1.IsEnum)(ManualReconcileResult),
    __metadata("design:type", String)
], ManualReconcilePaymentResponseDto.prototype, "result", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", PaymentDto)
], ManualReconcilePaymentResponseDto.prototype, "payment", void 0);
class CreateWalletTopupRequestDto {
    amount;
    transferContent;
    providerTxnId;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.CreateWalletTopupRequestDto = CreateWalletTopupRequestDto;
__decorate([
    (0, validation_decorators_1.ToNumber)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateWalletTopupRequestDto.prototype, "amount", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateWalletTopupRequestDto.prototype, "transferContent", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateWalletTopupRequestDto.prototype, "providerTxnId", void 0);
class ReviewWalletTopupRequestDto {
    rejectionReason;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.ReviewWalletTopupRequestDto = ReviewWalletTopupRequestDto;
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ReviewWalletTopupRequestDto.prototype, "rejectionReason", void 0);
class WalletPayBookingRequestDto {
    paymentId;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.WalletPayBookingRequestDto = WalletPayBookingRequestDto;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], WalletPayBookingRequestDto.prototype, "paymentId", void 0);
class WalletPayBookingResponseDto {
    payment;
    wallet;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.WalletPayBookingResponseDto = WalletPayBookingResponseDto;
class PaymentSucceeded {
    paymentId;
    bookingId;
    userId;
    amount;
    currency;
    occurredAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentSucceeded = PaymentSucceeded;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentSucceeded.prototype, "paymentId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentSucceeded.prototype, "bookingId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentSucceeded.prototype, "userId", void 0);
__decorate([
    (0, validation_decorators_1.ToNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], PaymentSucceeded.prototype, "amount", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], PaymentSucceeded.prototype, "currency", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], PaymentSucceeded.prototype, "occurredAt", void 0);
class PaymentFailed {
    paymentId;
    bookingId;
    userId;
    scenario;
    occurredAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentFailed = PaymentFailed;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentFailed.prototype, "paymentId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentFailed.prototype, "bookingId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentFailed.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FakePaymentScenario),
    __metadata("design:type", String)
], PaymentFailed.prototype, "scenario", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], PaymentFailed.prototype, "occurredAt", void 0);
class PaymentExpired {
    paymentId;
    bookingId;
    userId;
    occurredAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentExpired = PaymentExpired;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentExpired.prototype, "paymentId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentExpired.prototype, "bookingId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentExpired.prototype, "userId", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], PaymentExpired.prototype, "occurredAt", void 0);
class PaymentRefundRequested {
    paymentId;
    bookingId;
    userId;
    amount;
    currency;
    reason;
    requestedAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentRefundRequested = PaymentRefundRequested;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefundRequested.prototype, "paymentId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefundRequested.prototype, "bookingId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefundRequested.prototype, "userId", void 0);
__decorate([
    (0, validation_decorators_1.ToNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], PaymentRefundRequested.prototype, "amount", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], PaymentRefundRequested.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], PaymentRefundRequested.prototype, "reason", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], PaymentRefundRequested.prototype, "requestedAt", void 0);
class PaymentRefunded {
    paymentId;
    bookingId;
    refundId;
    userId;
    amount;
    currency;
    occurredAt;
    constructor(partial = {}) {
        Object.assign(this, partial);
    }
}
exports.PaymentRefunded = PaymentRefunded;
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefunded.prototype, "paymentId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefunded.prototype, "bookingId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefunded.prototype, "refundId", void 0);
__decorate([
    (0, validation_decorators_1.ToInteger)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PaymentRefunded.prototype, "userId", void 0);
__decorate([
    (0, validation_decorators_1.ToNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], PaymentRefunded.prototype, "amount", void 0);
__decorate([
    (0, validation_decorators_1.TrimmedText)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], PaymentRefunded.prototype, "currency", void 0);
__decorate([
    (0, validation_decorators_1.ToDate)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], PaymentRefunded.prototype, "occurredAt", void 0);
//# sourceMappingURL=payment.contract.js.map