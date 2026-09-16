import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    const fieldErrors = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.') || 'general';
      if (!fieldErrors[field]) {
        fieldErrors[field] = e.message;
      }
    });

    return res.status(400).json({
      message: 'Ошибка валидации данных',
      errors: fieldErrors
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      message: 'Запись с такими данными уже существует',
      detail: err.detail
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      message: 'Указанный связанный объект (автор или жанр) не существует или не может быть удален из-за существующих связей',
      detail: err.detail
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Внутренняя ошибка сервера'
  });
}
