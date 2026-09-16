import { Router } from 'express';
import { getAuthors, createAuthor } from '../controllers/authorController.js';

const router = Router();

router.get('/', getAuthors);
router.post('/', createAuthor);

export default router;
