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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { notificationService } from './notificationService';

export type ArticleCategory = 'Contrats' | 'Paiements' | 'Compliance' | 'Support';
export type ArticleType = 'personal' | 'general';
export type ArticleVisibility = 'public' | 'private';

export interface KnowledgeBaseArticle {
  id?: string;
  title: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  authorId: string;
  authorName: string;
  type: ArticleType;
  visibility: ArticleVisibility;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  feedback?: string; // Feedback from admin when approving/rejecting
  images?: string[]; // Array of image URLs
  summary?: string; // Short summary/preview of the content
}

const VALID_CATEGORIES: ArticleCategory[] = ['Contrats', 'Paiements', 'Compliance', 'Support'];

const COLLECTION_NAME = 'knowledgeBase';

// Create a type-safe converter
const articleConverter = {
  toFirestore(article: KnowledgeBaseArticle) {
    console.log('[KnowledgeBase] Converting article to Firestore format:', article);
    const { id, ...data } = article;
    return {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: data.authorId,
      authorName: data.authorName,
      type: data.type,
      visibility: data.visibility,
      approvalStatus: data.approvalStatus,
      images: data.images || [],
      summary: data.summary || data.content.substring(0, 150) + '...'
    };
  },
  fromFirestore(snapshot: any): KnowledgeBaseArticle {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : new Date(),
      authorId: data.authorId,
      authorName: data.authorName,
      type: data.type || 'general',
      visibility: data.visibility || 'public',
      approvalStatus: data.approvalStatus || 'pending',
      images: data.images || [],
      summary: data.summary || data.content.substring(0, 150) + '...'
    };
  },
};

const ensureAuth = () => {
  console.log('[KnowledgeBase] Checking authentication...');
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error('[KnowledgeBase] User not authenticated');
    throw new Error('User must be authenticated');
  }
  return auth.currentUser;
};

const getUserRole = async (userId: string) => {
  console.log('[KnowledgeBase] Getting user role for:', userId);
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    console.error('[KnowledgeBase] User document not found');
    throw new Error('User not found');
  }
  const userData = userDoc.data();
  console.log('[KnowledgeBase] User data:', userData);
  return userData.role;
};

const getUserFullName = async (userId: string) => {
  console.log('[KnowledgeBase] Getting user full name for:', userId);
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    console.error('[KnowledgeBase] User document not found');
    throw new Error('User not found');
  }
  const userData = userDoc.data();
  console.log('[KnowledgeBase] User data:', userData);
  return userData.name || 'Unknown User';
};

export const knowledgeBaseService = {
  // Get all articles
  getAllArticles: async (): Promise<KnowledgeBaseArticle[]> => {
    try {
      console.log('[KnowledgeBase] Starting to fetch all articles...');
      const user = ensureAuth();
      console.log('[KnowledgeBase] User authenticated:', user.uid);

      // Get user role
      const userRole = await getUserRole(user.uid);
      console.log('[KnowledgeBase] User role:', userRole);

      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      console.log('[KnowledgeBase] Created articles reference');
      
      // Build query to get all articles for all users, regardless of role
      const q = query(articlesRef, orderBy('createdAt', 'desc'));
      console.log('[KnowledgeBase] Created query to get all articles');
      
      const querySnapshot = await getDocs(q);
      console.log('[KnowledgeBase] Got query snapshot, size:', querySnapshot.size);
      
      const articles = querySnapshot.docs.map((doc: any) => {
        const article = articleConverter.fromFirestore(doc);
        return article;
      });
      
      console.log('[KnowledgeBase] Returning all articles, count:', articles.length);
      return articles;
    } catch (error) {
      console.error('[KnowledgeBase] Error getting articles:', error);
      throw error;
    }
  },

  // Get articles by author
  getArticlesByAuthor: async (authorId: string): Promise<KnowledgeBaseArticle[]> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      const q = query(
        articlesRef,
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => articleConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting author articles:', error);
      throw error;
    }
  },

  // Search articles
  searchArticles: async (searchQuery: string, category?: string, authorId?: string): Promise<KnowledgeBaseArticle[]> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      let q = query(articlesRef);

      if (category) {
        q = query(q, where('category', '==', category));
      }

      if (authorId) {
        q = query(q, where('authorId', '==', authorId));
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
  createArticle: async (article: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName' | 'approvalStatus'>): Promise<KnowledgeBaseArticle> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const userRole = await getUserRole(user.uid);
      console.log('[KnowledgeBase] User role:', userRole);

      const authorName = await getUserFullName(user.uid);
      console.log('[KnowledgeBase] Author name:', authorName);

      // Validate category
      if (!VALID_CATEGORIES.includes(article.category as ArticleCategory)) {
        throw new Error('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
      }

      // Check if user can create general articles
      if (article.type === 'general' && userRole !== 'admin') {
        throw new Error('Only administrators can create general articles');
      }

      const articleData: Omit<KnowledgeBaseArticle, 'id'> = {
        ...article,
        authorId: user.uid,
        authorName,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: article.tags.map(tag => tag.trim()).filter(tag => tag !== ''),
        visibility: article.visibility || 'public',
        approvalStatus: 'pending'
      };

      console.log('[KnowledgeBase] Creating article with data:', articleData);
      const articlesRef = collection(db, COLLECTION_NAME).withConverter(articleConverter);
      const docRef = await addDoc(articlesRef, articleData);
      
      console.log('[KnowledgeBase] Article created successfully with ID:', docRef.id);
      
      // If the user is not an admin, notify admins about the new article
      if (userRole !== 'admin') {
        try {
          await notificationService.notifyAdminsOfNewArticle(docRef.id, articleData.title);
          console.log('[KnowledgeBase] Admins notified about new article');
        } catch (notificationError) {
          console.error('[KnowledgeBase] Error notifying admins:', notificationError);
          // Don't throw the error here, as the article was created successfully
        }
      }
      
      return {
        ...articleData,
        id: docRef.id
      };
    } catch (error) {
      console.error('[KnowledgeBase] Error creating article:', error);
      throw error;
    }
  },

  // Update article
  updateArticle: async (id: string, article: Partial<KnowledgeBaseArticle>): Promise<void> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      const articleRef = doc(db, COLLECTION_NAME, id).withConverter(articleConverter);
      const articleDoc = await getDoc(articleRef);
      
      if (!articleDoc.exists()) {
        throw new Error('Article not found');
      }

      const existingArticle = articleConverter.fromFirestore(articleDoc);
      const userRole = await getUserRole(user.uid);

      // Only allow updates if user is admin or the original author
      if (userRole !== 'admin' && existingArticle.authorId !== user.uid) {
        throw new Error('You do not have permission to update this article');
      }

      // Prevent changing type to general if not admin
      if (article.type === 'general' && userRole !== 'admin') {
        throw new Error('Only administrators can create general articles');
      }

      // If the article is being updated by a different user (admin), update the author info
      if (existingArticle.authorId !== user.uid && userRole === 'admin') {
        const authorName = await getUserFullName(user.uid);
        await updateDoc(articleRef, {
          ...article,
          authorId: user.uid,
          authorName: authorName,
          updatedAt: new Date()
        });
      } else {
        await updateDoc(articleRef, {
          ...article,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  },

  // Delete article
  deleteArticle: async (id: string): Promise<void> => {
    try {
      console.log('[KnowledgeBase] Starting article deletion for ID:', id);
      const user = ensureAuth();
      console.log('[KnowledgeBase] User authenticated:', user.uid);

      const articleRef = doc(db, COLLECTION_NAME, id).withConverter(articleConverter);
      const articleDoc = await getDoc(articleRef);
      
      if (!articleDoc.exists()) {
        console.error('[KnowledgeBase] Article not found with ID:', id);
        throw new Error('Article not found');
      }

      const article = articleConverter.fromFirestore(articleDoc);
      console.log('[KnowledgeBase] Found article:', article);

      // Get user role from Firestore
      const userRole = await getUserRole(user.uid);
      console.log('[KnowledgeBase] User role:', userRole);

      // Only allow deletion if user is admin or the original author
      if (userRole !== 'admin' && article.authorId !== user.uid) {
        console.error('[KnowledgeBase] Permission denied. User role:', userRole, 'Article author:', article.authorId);
        throw new Error('You do not have permission to delete this article');
      }

      console.log('[KnowledgeBase] Deleting article with ID:', id);
      await deleteDoc(articleRef);
      console.log('[KnowledgeBase] Article successfully deleted');
    } catch (error) {
      console.error('[KnowledgeBase] Error deleting article:', error);
      throw error;
    }
  },

  // Update article approval status
  updateArticleApprovalStatus: async (
    id: string, 
    status: 'approved' | 'rejected', 
    message?: string
  ): Promise<void> => {
    try {
      const user = ensureAuth();
      if (!user) throw new Error('User must be authenticated');

      // Check if user is admin
      const userRole = await getUserRole(user.uid);
      if (userRole !== 'admin') {
        throw new Error('Only administrators can approve or reject articles');
      }

      const articleRef = doc(db, COLLECTION_NAME, id).withConverter(articleConverter);
      const articleDoc = await getDoc(articleRef);
      
      if (!articleDoc.exists()) {
        throw new Error('Article not found');
      }
      
      const article = articleDoc.data();
      
      // Update the article status
      await updateDoc(articleRef, {
        approvalStatus: status,
        updatedAt: new Date()
      });
      
      // Notify the author
      try {
        await notificationService.notifyAuthorOfApprovalStatus(
          article.authorId,
          id,
          article.title,
          status,
          message
        );
        console.log(`[KnowledgeBase] Author notified about ${status} status`);
      } catch (notificationError) {
        console.error('[KnowledgeBase] Error notifying author:', notificationError);
        // Don't throw the error here, as the status was updated successfully
      }
    } catch (error) {
      console.error('[KnowledgeBase] Error updating article approval status:', error);
      throw error;
    }
  },

  /**
   * Gets the role of a user
   * @param userId User ID
   * @returns Promise resolving to the user's role
   */
  async getUserRole(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      return userDoc.data().role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      throw error;
    }
  },

  /**
   * Gets all pending articles for admin approval
   * @returns Promise resolving to an array of pending articles
   */
  async getPendingArticles(): Promise<KnowledgeBaseArticle[]> {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user is admin
      const userRole = await this.getUserRole(user.uid);
      if (userRole !== 'admin') {
        throw new Error('Only administrators can access pending articles');
      }

      const articlesRef = collection(db, 'knowledgeBase').withConverter(articleConverter);
      const q = query(
        articlesRef,
        where('approvalStatus', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => doc.data());
    } catch (error) {
      console.error('Error getting pending articles:', error);
      throw error;
    }
  },

  async getArticleById(id: string): Promise<KnowledgeBaseArticle | null> {
    try {
      console.log('[KnowledgeBase] Getting article by ID:', id);
      ensureAuth();
      
      const docRef = doc(db, COLLECTION_NAME, id).withConverter(articleConverter);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('[KnowledgeBase] Article not found');
        return null;
      }
      
      const article = docSnap.data();
      return article;
    } catch (error) {
      console.error('[KnowledgeBase] Error getting article by ID:', error);
      throw error;
    }
  },
};
