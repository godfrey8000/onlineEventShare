import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(128)
});

export const LoginSchema = RegisterSchema;

export const UpsertEpisode = z.object({ name: z.string().min(1) });
export const UpsertMap = z.object({ name: z.string().min(1), episodeNumber: z.number().int(),level: z.number().min(1) });
export const UpsertChannel = z.object({ name: z.string().min(1), mapId: z.number().int() });

export const CreateTracker = z.object({
  episodeNumber: z.number().int(),
  mapId: z.number().int(),
  channelId: z.number().int(),
  level: z.number().min(1),
  status: z.number().min(0).max(5),
  nickname: z.string().min(1)
});

export const UpdateTracker = z.object({
  status: z.number().min(0).max(5).optional(),
  nickname: z.string().min(1).optional()
});