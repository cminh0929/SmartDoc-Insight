import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "intern", "staff"]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: UserRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  folderId: z.string().uuid().optional(),
});

export const DocumentSchema = CreateDocumentSchema.extend({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type Document = z.infer<typeof DocumentSchema>;
