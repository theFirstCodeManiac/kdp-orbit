import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './auth.ts';
import { db, DBCollection, DBSavedItem } from './db.ts';

export const savedRouter = Router();

savedRouter.get('/collections', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const userCollections: DBCollection[] = [];
  
  for (const collection of db.collections.values()) {
    if (collection.userId === userId) {
      userCollections.push(collection);
    }
  }
  
  res.json({ success: true, data: userCollections });
});

savedRouter.post('/collections', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: { message: 'Name is required' } });
  
  const newCollection: DBCollection = {
    id: 'c' + Date.now(),
    userId,
    name,
    itemCount: 0,
    updatedAt: new Date().toISOString()
  };
  
  db.collections.set(newCollection.id, newCollection);
  res.json({ success: true, data: newCollection });
});

savedRouter.get('/items', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { collectionId } = req.query;
  
  const userItems: DBSavedItem[] = [];
  
  for (const item of db.savedItems.values()) {
    if (item.userId === userId) {
      if (collectionId && collectionId !== 'all') {
        if (item.collectionId === collectionId) {
          userItems.push(item);
        }
      } else {
        userItems.push(item);
      }
    }
  }
  
  // Sort newest first
  userItems.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  
  res.json({ success: true, data: userItems });
});

savedRouter.delete('/collections/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const collectionId = req.params.id;
  
  const collection = db.collections.get(collectionId);
  if (!collection) {
    return res.status(404).json({ success: false, error: { message: 'Collection not found' } });
  }
  
  if (collection.userId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }
  
  db.collections.delete(collectionId);
  
  // Cascade delete items
  for (const item of db.savedItems.values()) {
    if (item.collectionId === collectionId) {
      db.savedItems.delete(item.id);
    }
  }
  
  res.json({ success: true });
});

savedRouter.delete('/items/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const itemId = req.params.id;
  
  const item = db.savedItems.get(itemId);
  if (!item) {
    return res.status(404).json({ success: false, error: { message: 'Item not found' } });
  }
  
  if (item.userId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }
  
  db.savedItems.delete(itemId);
  res.json({ success: true });
});
