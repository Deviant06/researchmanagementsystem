import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const studentSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  groupName: z.string().min(2).max(80)
});

export const stageUpdateSchema = z.object({
  status: z
    .enum(["NOT_STARTED", "SUBMITTED", "UNDER_REVIEW", "REVISED", "APPROVED"])
    .optional(),
  dueDate: z.string().datetime().optional()
});

export const commentSchema = z.object({
  section: z.string().min(2).max(80),
  category: z.enum(["MAJOR_REVISION", "MINOR_REVISION", "APPROVED"]),
  text: z.string().min(4).max(1200)
});

export const replySchema = z.object({
  text: z.string().min(2).max(1200)
});

export const addressSchema = z.object({
  addressed: z.boolean()
});

export const taskSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  studentResponse: z.string().max(1200).optional()
});

export const resourceSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(2).max(400),
  category: z.enum(["TEMPLATE", "RUBRIC", "SAMPLE_PAPER", "VIDEO_GUIDE"]),
  externalUrl: z.string().url().optional().or(z.literal(""))
});
