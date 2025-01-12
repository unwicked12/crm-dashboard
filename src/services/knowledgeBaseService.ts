import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface KnowledgeBaseArticle {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = 'knowledgeBase';

// Create a type-safe converter
const articleConverter = {
  toFirestore(article: KnowledgeBaseArticle) {
    const { id, ...data } = article;
    return {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
      updatedAt: data.updatedAt ? Timestamp.fromDate(data.updatedAt) : Timestamp.now(),
    };
  },
  fromFirestore(snapshot: any): KnowledgeBaseArticle {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  },
};

const ensureAuth = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }
  return auth.currentUser;
};

export const knowledgeBaseService = {
  // Get all articles
  getAllArticles: async (): Promise<KnowledgeBaseArticle[]> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      const q = query(articlesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => articleConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting articles:', error);
      throw error;
    }
  },

  // Search articles
  searchArticles: async (searchQuery: string, category?: string): Promise<KnowledgeBaseArticle[]> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      let q = query(articlesRef);

      if (category) {
        q = query(q, where('category', '==', category));
      }

      if (searchQuery) {
        q = query(
          q,
          where('title', '>=', searchQuery),
          where('title', '<=', searchQuery + '\uf8ff')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => articleConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  },

  // Create article
  createArticle: async (article: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBaseArticle> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      const now = new Date();
      const newArticle: KnowledgeBaseArticle = {
        ...article,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(articlesRef, newArticle);
      return {
        ...newArticle,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  },

  // Update article
  updateArticle: async (id: string, article: Partial<KnowledgeBaseArticle>): Promise<void> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articleRef = doc(db, COLLECTION_NAME, id).withConverter(articleConverter);
      await updateDoc(articleRef, {
        ...article,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  },

  // Delete article
  deleteArticle: async (id: string): Promise<void> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articleRef = doc(db, COLLECTION_NAME, id).withConverter(articleConverter);
      await deleteDoc(articleRef);
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }
};
