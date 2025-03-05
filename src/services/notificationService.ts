// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import type { 
  DocumentSnapshot, 
  QueryDocumentSnapshot 
} from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuth } from 'firebase/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User, UserRole } from './userService';

// Collection name
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COLLECTION_NAME = 'notifications';

// Notification types
export type NotificationType = 
  | 'article_approval' 
  | 'holiday_request' 
  | 'task_assignment' 
  | 'faq_response';

// Notification interface
export interface Notification {
  id?: string;
  type: NotificationType;
  recipientId: string;
  senderId: string;
  senderName: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Ensure user is authenticated
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ensureAuth = () => {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return user;
};

// Helper function to get user's full name
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUserFullName = async (userId: string): Promise<string> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    console.error('User document not found');
    throw new Error('User not found');
  }
  const userData = userDoc.data();
  return userData.name || 'Unknown User';
};

// Helper function to get users by role
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', role));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      tier: data.tier,
      capabilities: data.capabilities,
      schedule: data.schedule
    } as User;
  });
};

// Notification converter
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notificationConverter = {
  toFirestore: (notification: Notification) => {
    return {
      type: notification.type,
      recipientId: notification.recipientId,
      senderId: notification.senderId,
      senderName: notification.senderName,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: Timestamp.fromDate(notification.createdAt)
    };
  },
  fromFirestore: (snapshot: any, options?: any) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      type: data.type,
      recipientId: data.recipientId,
      senderId: data.senderId,
      senderName: data.senderName,
      title: data.title,
      message: data.message,
      data: data.data,
      read: data.read,
      createdAt: data.createdAt.toDate()
    } as Notification;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const notificationService = {
  // Create a notification
  createNotification: async (
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<Notification> => {
    try {
      const user = ensureAuth();
      const senderName = await getUserFullName(user.uid);
      
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const notificationData: Omit<Notification, 'id'> = {
        type,
        recipientId,
        senderId: user.uid,
        senderName,
        title,
        message,
        data,
        read: false,
        createdAt: new Date()
      };
      
      const notificationsRef = collection(db, COLLECTION_NAME).withConverter(notificationConverter);
      const docRef = await addDoc(notificationsRef, notificationData);
      
      return {
        ...notificationData,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
  
  // Get notifications for current user
  getUserNotifications: async (unreadOnly: boolean = false): Promise<Notification[]> => {
    try {
      const user = ensureAuth();
      const notificationsRef = collection(db, COLLECTION_NAME).withConverter(notificationConverter);
      
      let q;
      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('recipientId', '==', user.uid),
          where('read', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          notificationsRef,
          where('recipientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => notificationConverter.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const user = ensureAuth();
      const notificationRef = doc(db, COLLECTION_NAME, notificationId);
      
      // Verify the notification belongs to the user
      const notificationDoc = await getDoc(notificationRef);
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notification = notificationDoc.data();
      if (notification.recipientId !== user.uid) {
        throw new Error('Unauthorized access to notification');
      }
      
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  // Create article approval notification for admins
  notifyAdminsOfNewArticle: async (articleId: string, articleTitle: string): Promise<void> => {
    try {
      const user = ensureAuth();
      
      // Get all admin users
      const adminUsers = await getUsersByRole('admin');
      
      // Create a notification for each admin
      const promises = adminUsers.map(admin => 
        notificationService.createNotification(
          admin.id,
          'article_approval',
          'New Article Pending Approval',
          `A new article "${articleTitle}" requires your approval.`,
          {
            articleId,
            articleTitle,
            status: 'pending',
            authorId: user.uid,
            authorName: user.displayName || 'Unknown User'
          }
        )
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying admins of new article:', error);
      throw error;
    }
  },
  
  // Notify article author of approval status change
  notifyAuthorOfApprovalStatus: async (
    authorId: string, 
    articleId: string, 
    articleTitle: string, 
    status: 'approved' | 'rejected',
    message: string = ''
  ): Promise<void> => {
    try {
      const user = ensureAuth();
      
      const title = status === 'approved' 
        ? 'Article Approved' 
        : 'Article Rejected';
      
      const defaultMessage = status === 'approved'
        ? `Your article "${articleTitle}" has been approved and is now visible to users.`
        : `Your article "${articleTitle}" has been rejected.`;
      
      await notificationService.createNotification(
        authorId,
        'article_approval',
        title,
        message || defaultMessage,
        {
          articleId,
          articleTitle,
          status,
          reviewerId: user.uid,
          reviewerName: user.displayName || 'Admin'
        }
      );
    } catch (error) {
      console.error('Error notifying author of approval status:', error);
      throw error;
    }
  }
};

export default notificationService;