import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './auth.ts';
import { db, DBCollection, DBSavedItem } from './db.ts';

export const savedRouter = Router();

savedRouter.get('/collections', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const userCollections = await db.getCollections(userId);
  res.json({ success: true, data: userCollections });
});

savedRouter.post('/collections', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, error: { message: 'Collection name is required' } });
  }
  
  const newCollection = await db.createCollection(userId, name);
  res.json({ success: true, data: newCollection });
});

savedRouter.get('/items', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { collectionId } = req.query;
  const userItems = await db.getSavedItems(userId, typeof collectionId === 'string' ? collectionId : undefined);
  res.json({ success: true, data: userItems });
});

savedRouter.post('/items', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { collectionId, type, title, subtitle, meta } = req.body;

  if (!title || !type) {
    return res.status(400).json({ success: false, error: { message: 'Title and type are required' } });
  }

  // Check if item already exists to avoid duplicates
  const existing = Array.from((await db.getAllSavedItems())).find(
    i => i.userId === userId && i.type === type && (i.title === title || (meta?.asin && i.meta?.asin === meta.asin))
  );

  if (existing) {
    return res.json({ success: true, data: existing, message: 'Item already saved' });
  }

  const saved = await db.saveItem(userId, { collectionId, type, title, subtitle, meta });
  res.json({ success: true, data: saved });
});

savedRouter.delete('/collections/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const collectionId = req.params.id;
  
  const collection = await db.getCollection(collectionId);
  if (!collection) {
    return res.status(404).json({ success: false, error: { message: 'Collection not found' } });
  }

  if (collection.userId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }
  
  await db.deleteCollection(userId, collectionId);
  res.json({ success: true });
});

savedRouter.delete('/items/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const itemId = req.params.id;
  
  const item = await db.getSavedItem(itemId);
  if (!item) {
    return res.status(404).json({ success: false, error: { message: 'Item not found' } });
  }

  if (item.userId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }
  
  await db.deleteSavedItem(userId, itemId);
  res.json({ success: true });
});

// Cover Projects Endpoints
savedRouter.get('/cover-projects', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const projects = await db.getCoverProjects(userId);
  res.json({ success: true, data: projects });
});

savedRouter.post('/cover-projects', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const project = await db.saveCoverProject(userId, req.body);
  res.json({ success: true, data: project });
});

savedRouter.delete('/cover-projects/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const success = await db.deleteCoverProject(userId, req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }
  res.json({ success: true });
});
