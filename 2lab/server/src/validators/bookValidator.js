import { z } from 'zod';

export const createBookSchema = z.object({
  title: z
    .string({ required_error: "Название обязательно" })
    .trim()
    .min(1, "Название обязательно")
    .max(255, "Название не должно превышать 255 символов"),
  authorId: z.coerce
    .number({ invalid_type_error: "Укажите корректного автора" })
    .int("ID автора должен быть целым числом")
    .positive("Укажите корректного автора"),
  genreId: z.coerce
    .number({ invalid_type_error: "Укажите корректный жанр" })
    .int("ID жанра должен быть целым числом")
    .positive("Укажите корректный жанр"),
  year: z.coerce
    .number({ invalid_type_error: "Год должен быть числом" })
    .int("Год должен быть целым числом")
    .min(0, "Год не может быть отрицательным")
    .max(new Date().getFullYear(), "Год не может быть в будущем"),
  status: z.enum(["planned", "reading", "completed"], {
    errorMap: () => ({ message: "Некорректный статус. Допустимы: planned, reading, completed" })
  }),
  description: z.string().trim().optional().nullable()
});

export const updateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Название обязательно")
    .max(255, "Название не должно превышать 255 символов")
    .optional(),
  authorId: z.coerce
    .number()
    .int()
    .positive("Укажите корректного автора")
    .optional(),
  genreId: z.coerce
    .number()
    .int()
    .positive("Укажите корректный жанр")
    .optional(),
  year: z.coerce
    .number()
    .int()
    .min(0, "Год не может быть отрицательным")
    .max(new Date().getFullYear(), "Год не может быть в будущем")
    .optional(),
  status: z
    .enum(["planned", "reading", "completed"], {
      errorMap: () => ({ message: "Некорректный статус" })
    })
    .optional(),
  description: z.string().trim().optional().nullable()
});

export const updateStatusSchema = z.object({
  status: z.enum(["planned", "reading", "completed"], {
    errorMap: () => ({ message: "Некорректный статус. Допустимы: planned, reading, completed" })
  })
});
