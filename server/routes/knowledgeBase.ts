import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all articles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      orderBy: {
        lastUpdated: 'desc'
      }
    });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Search articles
router.get('/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        OR: [
          {
            title: {
              contains: q as string,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: q as string,
              mode: 'insensitive'
            }
          },
          {
            category: {
              contains: q as string,
              mode: 'insensitive'
            }
          },
          {
            tags: {
              hasSome: [(q as string)]
            }
          }
        ]
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });
    res.json(articles);
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// Get single article
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const article = await prisma.knowledgeArticle.findUnique({
      where: {
        id: req.params.id
      }
    });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Create article (admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create articles' });
  }

  const { title, content, category, tags } = req.body;
  try {
    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        content,
        category,
        tags,
        lastUpdated: new Date()
      }
    });
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Update article (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update articles' });
  }

  const { title, content, category, tags } = req.body;
  try {
    const article = await prisma.knowledgeArticle.update({
      where: {
        id: req.params.id
      },
      data: {
        title,
        content,
        category,
        tags,
        lastUpdated: new Date()
      }
    });
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete article (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete articles' });
  }

  try {
    await prisma.knowledgeArticle.delete({
      where: {
        id: req.params.id
      }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

export default router;
