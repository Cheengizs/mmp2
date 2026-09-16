import { z } from 'zod';

export const createGenreSchema = z.object({
  name: z
    .string({ required_error: "Название жанра обязательно" })
    .trim()
    .min(1, "Название жанра обязательно")
    .max(100, "Название жанра не должно превышать 100 символов"),
  description: z.string().trim().optional().nullable()
});
