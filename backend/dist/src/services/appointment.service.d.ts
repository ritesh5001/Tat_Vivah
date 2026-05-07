import type { Role } from '@prisma/client';
import type { BlockSellerInput, CreateAppointmentInput, RescheduleAppointmentInput, UpdateAppointmentStatusInput, UpsertSellerAvailabilityInput } from '../validators/appointment.validation.js';
type ActorContext = {
    userId: string;
    role: Role;
};
export declare class AppointmentService {
    private autoCompletePastAppointments;
    private assertSeller;
    private assertBuyer;
    private ensureSlotAvailable;
    createAppointment(userId: string, input: CreateAppointmentInput): Promise<{
        appointment: {
            id: any;
            userId: any;
            sellerId: any;
            productId: any;
            date: any;
            time: any;
            status: any;
            whatsappNumber: any;
            whatsappLink: string;
            startsAt: Date;
            endsAt: Date;
            joinWindowStart: Date;
            joinActive: boolean;
            callStartsSoon: boolean;
            notes: any;
            createdAt: any;
            updatedAt: any;
            user: any;
            seller: any;
            product: any;
        };
    }>;
    listUserAppointments(userId: string): Promise<{
        appointments: {
            id: any;
            userId: any;
            sellerId: any;
            productId: any;
            date: any;
            time: any;
            status: any;
            whatsappNumber: any;
            whatsappLink: string;
            startsAt: Date;
            endsAt: Date;
            joinWindowStart: Date;
            joinActive: boolean;
            callStartsSoon: boolean;
            notes: any;
            createdAt: any;
            updatedAt: any;
            user: any;
            seller: any;
            product: any;
        }[];
    }>;
    listSellerAppointments(sellerId: string): Promise<{
        appointments: {
            id: any;
            userId: any;
            sellerId: any;
            productId: any;
            date: any;
            time: any;
            status: any;
            whatsappNumber: any;
            whatsappLink: string;
            startsAt: Date;
            endsAt: Date;
            joinWindowStart: Date;
            joinActive: boolean;
            callStartsSoon: boolean;
            notes: any;
            createdAt: any;
            updatedAt: any;
            user: any;
            seller: any;
            product: any;
        }[];
    }>;
    listAdminAppointments(): Promise<{
        appointments: {
            id: any;
            userId: any;
            sellerId: any;
            productId: any;
            date: any;
            time: any;
            status: any;
            whatsappNumber: any;
            whatsappLink: string;
            startsAt: Date;
            endsAt: Date;
            joinWindowStart: Date;
            joinActive: boolean;
            callStartsSoon: boolean;
            notes: any;
            createdAt: any;
            updatedAt: any;
            user: any;
            seller: any;
            product: any;
        }[];
    }>;
    updateAppointmentStatus(actor: ActorContext, input: UpdateAppointmentStatusInput): Promise<{
        appointment: {
            id: any;
            userId: any;
            sellerId: any;
            productId: any;
            date: any;
            time: any;
            status: any;
            whatsappNumber: any;
            whatsappLink: string;
            startsAt: Date;
            endsAt: Date;
            joinWindowStart: Date;
            joinActive: boolean;
            callStartsSoon: boolean;
            notes: any;
            createdAt: any;
            updatedAt: any;
            user: any;
            seller: any;
            product: any;
        };
    }>;
    rescheduleAppointment(actor: ActorContext, input: RescheduleAppointmentInput): Promise<{
        appointment: {
            id: any;
            userId: any;
            sellerId: any;
            productId: any;
            date: any;
            time: any;
            status: any;
            whatsappNumber: any;
            whatsappLink: string;
            startsAt: Date;
            endsAt: Date;
            joinWindowStart: Date;
            joinActive: boolean;
            callStartsSoon: boolean;
            notes: any;
            createdAt: any;
            updatedAt: any;
            user: any;
            seller: any;
            product: any;
        };
    }>;
    blockSeller(actor: ActorContext, input: BlockSellerInput): Promise<{
        message: string;
        sellerId: string;
        cancelledAppointments: number;
    }>;
    listSellerAvailability(sellerId: string): Promise<{
        availability: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            isActive: boolean;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }>;
    upsertSellerAvailability(sellerId: string, input: UpsertSellerAvailabilityInput): Promise<{
        availability: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            isActive: boolean;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        };
    }>;
}
export declare const appointmentService: AppointmentService;
export {};
//# sourceMappingURL=appointment.service.d.ts.map