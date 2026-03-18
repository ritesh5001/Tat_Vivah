import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z.object({
  sellerId: z.string().min(1, 'sellerId is required'),
  productId: z.string().min(1).optional(),
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  time: z.string().regex(timeRegex, 'time must be in HH:mm format'),
  notes: z.string().max(500, 'notes must be at most 500 characters').optional(),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId is required'),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'appointmentId is required'),
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  time: z.string().regex(timeRegex, 'time must be in HH:mm format'),
});

export const blockSellerSchema = z.object({
  sellerId: z.string().min(1, 'sellerId is required'),
});

export const upsertSellerAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm format'),
  isActive: z.boolean().optional().default(true),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
export type BlockSellerInput = z.infer<typeof blockSellerSchema>;
export type UpsertSellerAvailabilityInput = z.infer<typeof upsertSellerAvailabilitySchema>;
