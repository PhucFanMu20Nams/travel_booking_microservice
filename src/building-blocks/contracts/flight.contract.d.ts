import { IEvent } from '@nestjs/cqrs';
export declare enum FlightStatus {
    UNKNOWN = 0,
    FLYING = 1,
    DELAY = 2,
    CANCELED = 3,
    COMPLETED = 4,
    SCHEDULED = 5
}
export declare enum SeatClass {
    UNKNOWN = 0,
    FIRST_CLASS = 1,
    BUSINESS = 2,
    ECONOMY = 3
}
export declare enum SeatType {
    UNKNOWN = 0,
    WINDOW = 1,
    MIDDLE = 2,
    AISLE = 3
}
export declare enum SeatState {
    AVAILABLE = 0,
    HELD = 1,
    BOOKED = 2
}
export declare enum SeatReleaseReason {
    BOOKING_CANCELED = 0,
    BOOKING_CREATE_FAILED = 1,
    BOOKING_EXPIRED = 2,
    PAYMENT_INTENT_CREATE_FAILED = 3
}
export declare const PREMIUM_SEAT_SELECTION_REQUIRED_CODE = "PREMIUM_SEAT_SELECTION_REQUIRED";
export declare const PREMIUM_SEAT_SELECTION_REQUIRED_MESSAGE = "Economy seats are sold out. Please select a premium seat to continue.";
export declare class FlightCreated implements IEvent {
    id: number;
    flightNumber: string;
    price: number;
    flightStatus: FlightStatus;
    flightDate: Date;
    departureDate: Date;
    departureAirportId: number;
    aircraftId: number;
    arriveDate: Date;
    arriveAirportId: number;
    durationMinutes: number;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<FlightCreated>);
}
export declare class AircraftCreated implements IEvent {
    id: number;
    model: string;
    name: string;
    manufacturingYear: number;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<AircraftCreated>);
}
export declare class AirportCreated implements IEvent {
    id: number;
    code: string;
    name: string;
    address: string;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<AirportCreated>);
}
export declare class SeatCreated implements IEvent {
    id: number;
    seatNumber: string;
    seatClass: SeatClass;
    seatType: SeatType;
    flightId: number;
    isReserved: boolean;
    seatState?: SeatState;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<SeatCreated>);
}
export declare class SeatReserved implements IEvent {
    id: number;
    seatNumber: string;
    seatClass: SeatClass;
    seatType: SeatType;
    flightId: number;
    price: number;
    currency: string;
    isReserved: boolean;
    seatState?: SeatState;
    holdToken?: string;
    holdExpiresAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<SeatReserved>);
}
export declare class SeatReleaseRequested implements IEvent {
    bookingId?: number;
    holdToken?: string;
    seatNumber: string;
    flightId: number;
    reason: SeatReleaseReason;
    requestedAt: Date;
    constructor(request?: Partial<SeatReleaseRequested>);
}
export declare class SeatCommitRequested implements IEvent {
    seatNumber: string;
    flightId: number;
    holdToken: string;
    bookingId: number;
    committedAt: Date;
    constructor(request?: Partial<SeatCommitRequested>);
}
export declare class FlightDto {
    id: number;
    flightNumber: string;
    price: number;
    flightStatus: FlightStatus;
    flightDate: Date;
    departureDate: Date;
    departureAirportId: number;
    aircraftId: number;
    arriveDate: Date;
    arriveAirportId: number;
    durationMinutes: number;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<FlightDto>);
}
export declare class SeatDto {
    id: number;
    seatNumber: string;
    seatClass: SeatClass;
    seatType: SeatType;
    flightId: number;
    price: number;
    currency: string;
    isReserved: boolean;
    seatState?: SeatState;
    createdAt: Date;
    updatedAt?: Date;
    constructor(request?: Partial<SeatDto>);
}
export declare class SeatReservationDto extends SeatDto {
    holdToken?: string;
    holdExpiresAt?: Date;
    constructor(request?: Partial<SeatReservationDto>);
}
export declare class SeatStateDto {
    id: number;
    seatNumber: string;
    flightId: number;
    seatState: SeatState;
    isReserved: boolean;
    holdExpiresAt?: Date | null;
    reservedBookingId?: number | null;
    updatedAt?: Date | null;
    constructor(request?: Partial<SeatStateDto>);
}
export declare class ReserveSeatRequestDto {
    seatNumber?: string;
    flightId: number;
    holdUntil?: Date;
    constructor(request?: Partial<ReserveSeatRequestDto>);
}
