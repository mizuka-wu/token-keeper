import { z } from 'zod'

// Group schemas
export const GroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  order_index: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
})

export const UpdateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').optional(),
  description: z.string().optional(),
})

// Token schemas
export const TokenSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.string(),
  env_name: z.string(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  expired_at: z.string().nullable().optional(),
  order_index: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  group_ids: z.array(z.number()).optional(),
})

export const CreateTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required'),
  value: z.string().min(1, 'Token value is required').max(500, 'Token value must be less than 500 characters'),
  env_name: z.string().min(1, 'Environment is required'),
  website: z.string().url('Invalid URL').optional(),
  description: z.string().max(100, 'Description must be less than 100 characters').optional(),
  tags: z.array(z.string()).optional(),
  expired_at: z.string().optional(),
})

export const UpdateTokenSchema = z.object({
  name: z.string().min(1, 'Token name is required').optional(),
  value: z.string().min(1, 'Token value is required').max(500, 'Token value must be less than 500 characters').optional(),
  env_name: z.string().min(1, 'Environment is required').optional(),
  website: z.string().url('Invalid URL').optional(),
  description: z.string().max(100, 'Description must be less than 100 characters').optional(),
  tags: z.array(z.string()).optional(),
  expired_at: z.string().optional(),
})

// Type exports
export type Group = z.infer<typeof GroupSchema>
export type CreateGroup = z.infer<typeof CreateGroupSchema>
export type UpdateGroup = z.infer<typeof UpdateGroupSchema>

export type Token = z.infer<typeof TokenSchema>
export type CreateToken = z.infer<typeof CreateTokenSchema>
export type UpdateToken = z.infer<typeof UpdateTokenSchema>
