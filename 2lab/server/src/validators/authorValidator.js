import { z } from 'zod';

export const createAuthorSchema = z.object({
  firstName: z
    .string({ required_error: "Имя автора обязательно" })
    .trim()
    .min(1, "Имя автора обязательно")
    .max(100, "Имя не должно превышать 100 символов"),
  lastName: z
    .string({ required_error: "Фамилия автора обязательна" })
    .trim()
    .min(1, "Фамилия автора обязательна")
    .max(100, "Фамилия не должна превышать 100 символов"),
  bio: z.string().trim().optional().nullable()
});
