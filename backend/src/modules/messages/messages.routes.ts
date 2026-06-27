import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { sendMessageController, getMessagesController, updateStatusController, deleteMessageController } from './messages.controller.js';
import { getConversationsController } from './conversations.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/send', sendMessageController);
router.get('/conversations', getConversationsController);
router.get('/:conversationId', getMessagesController);
router.patch('/:messageId/status', updateStatusController);
router.delete('/:messageId', deleteMessageController);

export default router;
