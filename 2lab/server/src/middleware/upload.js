import multer from 'multer';

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('INVALID_FILE_TYPE');
      err.code = 'INVALID_FILE_TYPE';
      cb(err);
    }
  }
});

export const uploadCover = (fieldName = 'cover') => {
  const single = multerUpload.single(fieldName);

  return (req, res, next) => {
    single(req, res, (err) => {
      if (err) {
        if (err.code === 'INVALID_FILE_TYPE' || err.message === 'INVALID_FILE_TYPE') {
          return res.status(415).json({
            message: 'Неподдерживаемый тип файла. Разрешены только форматы JPEG, PNG, WEBP.',
            errors: { [fieldName]: 'Разрешены только форматы JPEG, PNG, WEBP' }
          });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: 'Размер файла превышает лимит 5 МБ.',
            errors: { [fieldName]: 'Размер файла не должен превышать 5 МБ' }
          });
        }
        return res.status(400).json({
          message: `Ошибка загрузки файла: ${err.message}`,
          errors: { [fieldName]: err.message }
        });
      }
      next();
    });
  };
};
