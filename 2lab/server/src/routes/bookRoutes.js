import { Router } from 'express';
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  updateBookStatus,
  deleteBook,
  streamBookCover
} from '../controllers/bookController.js';
import { uploadCover } from '../middleware/upload.js';

const router = Router();

router.get('/cover/:blobName', streamBookCover);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', uploadCover('cover'), createBook);
router.put('/:id', uploadCover('cover'), updateBook);
router.patch('/:id/status', updateBookStatus);
router.delete('/:id', deleteBook);

export default router;
