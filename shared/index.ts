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

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const TagSchema = CreateTagSchema.extend({
  id: z.string().uuid(),
});

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  folderId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const DocumentSchema = CreateDocumentSchema.extend({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type CreateTag = z.infer<typeof CreateTagSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type Document = z.infer<typeof DocumentSchema>;

export const PermissionLevelSchema = z.enum(["read", "write", "admin"]);

export const GrantPermissionSchema = z.object({
  userId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  level: PermissionLevelSchema,
});

export const PermissionSchema = GrantPermissionSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;
export type GrantPermission = z.infer<typeof GrantPermissionSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
