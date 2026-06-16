import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  fullName: z.string().min(2).optional(),
  bio: z.string().max(300, 'Bio must be at most 300 characters').optional(),
  age: z.number().min(18, 'Must be at least 18').max(99, 'Must be at most 99').optional(),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say', 'male', 'female', 'non_binary', 'other']).optional(),
  orientation: z.enum(['straight', 'gay', 'bisexual', 'other']).optional(),
  intent: z.enum(['casual', 'friendship', 'relationship', 'friends', 'one_night', 'dating']).optional(),
  interests: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  whatsapp: z.string().max(20).optional(),
  instagram: z.string().max(50).optional(),
  whatsappNumber: z.string().max(20).optional(),
  instagramUsername: z.string().max(50).optional(),
  shareWhatsapp: z.boolean().optional(),
  shareInstagram: z.boolean().optional(),
  ghostMode: z.boolean().optional(),
  idealSunday: z.string().max(150).optional(),
  matchPreferences: z.object({
    gender: z.enum(['Male', 'Female', 'Both', 'Any', 'male', 'female', 'both', 'any']),
    ageRange: z.object({
      min: z.number().min(18).max(99),
      max: z.number().min(18).max(99),
    }),
    city: z.string().optional(),
  }).optional(),
});
