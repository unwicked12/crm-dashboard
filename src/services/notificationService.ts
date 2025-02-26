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
  serverTimestamp,
  Timestamp,
  getDoc,
  deleteDoc,
  limit,
  DocumentSnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { httpsCallable, getFunctions } from 'firebase/functions';

export type NotificationType = 
  | 'article_approval_request' 
  | 'article_approved' 
  | 'article_rejected' 
  | 'holiday_request' 
  | 'holiday_approved' 
  | 'holiday_rejected'
  | 'task_assigned'
  | 'task_completed';

export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  read: boolean;
  createdAt: Date;
  relatedItemId?: string;
  relatedItemType?: 'article' | 'holiday' | 'task';
  link?: string;
}

const COLLECTION_NAME = 'notifications';

// Helper function to ensure user is authenticated
const ensureAuth = () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }
  return auth.currentUser;
};

// Helper function to get user data
const getUserData = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  return userDoc.data();
};

export const notificationService = {
  // Create a new notification
  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> => {
    try {
      const user = ensureAuth();
      
      // Set sender information if not provided
      const senderInfo = notification.senderId ? {} : {
        senderId: user.uid,
        senderName: user.displayName || 'Unknown User'
      };
      
      const notificationData = {
        ...notification,
        ...senderInfo,
        read: false,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
      
      // Try to send email notification
      try {
        await notificationService.sendEmailNotification(notification);
      } catch (error) {
        console.error('Failed to send email notification:', error);
        // Continue even if email fails
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
  
  // Get notifications for the current user
  getUserNotifications: async (unreadOnly = false, maxResults = 50): Promise<Notification[]> => {
    try {
      const user = ensureAuth();
      
      let q;
      
      if (unreadOnly) {
        // Query for unread notifications
        q = query(
          collection(db, COLLECTION_NAME),
          where('recipientId', '==', user.uid),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
      } else {
        // Query for all notifications
        q = query(
          collection(db, COLLECTION_NAME),
          where('recipientId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          type: data.type,
          title: data.title,
          message: data.message,
          recipientId: data.recipientId,
          senderId: data.senderId,
          senderName: data.senderName,
          read: data.read,
          createdAt: data.createdAt?.toDate() || new Date(),
          relatedItemId: data.relatedItemId,
          relatedItemType: data.relatedItemType,
          link: data.link
        };
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const user = ensureAuth();
      
      // Verify the notification belongs to the user
      const notificationRef = doc(db, COLLECTION_NAME, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notificationData = notificationDoc.data();
      if (notificationData.recipientId !== user.uid) {
        throw new Error('You do not have permission to update this notification');
      }
      
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      const user = ensureAuth();
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('recipientId', '==', user.uid),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map((docSnapshot) => 
        updateDoc(docSnapshot.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      const user = ensureAuth();
      
      // Verify the notification belongs to the user
      const notificationRef = doc(db, COLLECTION_NAME, notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }
      
      const notificationData = notificationDoc.data();
      if (notificationData.recipientId !== user.uid) {
        throw new Error('You do not have permission to delete this notification');
      }
      
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
  
  // Get unread notification count for the current user
  getUnreadCount: async (): Promise<number> => {
    try {
      const user = ensureAuth();
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where('recipientId', '==', user.uid),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },
  
  // Send email notification using Cloud Functions
  sendEmailNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> => {
    try {
      // Get recipient data to get their email
      const recipientData = await getUserData(notification.recipientId);
      const recipientEmail = recipientData.email;
      
      if (!recipientEmail) {
        throw new Error('Recipient email not found');
      }
      
      // Use Cloud Functions to send email
      const functions = getFunctions();
      const sendEmail = httpsCallable(functions, 'sendEmailNotification');
      
      await sendEmail({
        email: recipientEmail,
        subject: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link || ''
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  },
  
  // Create article approval request notification
  createArticleApprovalRequest: async (articleId: string, articleTitle: string, authorId: string, authorName: string): Promise<void> => {
    try {
      // Find admin users to notify
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      
      const querySnapshot = await getDocs(q);
      
      const notificationPromises = querySnapshot.docs.map((docSnapshot) => {
        const adminId = docSnapshot.id;
        
        return notificationService.createNotification({
          type: 'article_approval_request',
          title: 'Nouvel article à approuver',
          message: `${authorName} a soumis un nouvel article "${articleTitle}" qui nécessite votre approbation.`,
          recipientId: adminId,
          senderId: authorId,
          senderName: authorName,
          relatedItemId: articleId,
          relatedItemType: 'article',
          link: `/knowledge-base?article=${articleId}`
        });
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating article approval notifications:', error);
      throw error;
    }
  },
  
  // Create article status update notification
  createArticleStatusNotification: async (
    articleId: string, 
    articleTitle: string, 
    authorId: string, 
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<void> => {
    try {
      const user = ensureAuth();
      const adminName = user.displayName || 'Admin';
      
      const title = status === 'approved' 
        ? 'Article approuvé' 
        : 'Article rejeté';
        
      const message = status === 'approved'
        ? `Votre article "${articleTitle}" a été approuvé par ${adminName}.`
        : `Votre article "${articleTitle}" a été rejeté par ${adminName}. Raison: ${rejectionReason || 'Non spécifiée'}`;
      
      await notificationService.createNotification({
        type: status === 'approved' ? 'article_approved' : 'article_rejected',
        title,
        message,
        recipientId: authorId,
        senderId: user.uid,
        senderName: adminName,
        relatedItemId: articleId,
        relatedItemType: 'article',
        link: `/knowledge-base?article=${articleId}`
      });
    } catch (error) {
      console.error('Error creating article status notification:', error);
      throw error;
    }
  },
  
  // Create holiday request notification
  createHolidayRequestNotification: async (
    requestId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    userName: string
  ): Promise<void> => {
    try {
      // Find HR users to notify
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'hr')
      );
      
      const querySnapshot = await getDocs(q);
      
      const startDateStr = startDate.toLocaleDateString();
      const endDateStr = endDate.toLocaleDateString();
      
      const notificationPromises = querySnapshot.docs.map((docSnapshot) => {
        const hrId = docSnapshot.id;
        
        return notificationService.createNotification({
          type: 'holiday_request',
          title: 'Nouvelle demande de congé',
          message: `${userName} a soumis une demande de congé du ${startDateStr} au ${endDateStr}.`,
          recipientId: hrId,
          senderId: userId,
          senderName: userName,
          relatedItemId: requestId,
          relatedItemType: 'holiday',
          link: `/hr/leaves?request=${requestId}`
        });
      });
      
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error creating holiday request notifications:', error);
      throw error;
    }
  },
  
  // Create task assignment notification
  createTaskAssignmentNotification: async (
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    assignerId: string,
    assignerName: string
  ): Promise<void> => {
    try {
      await notificationService.createNotification({
        type: 'task_assigned',
        title: 'Nouvelle tâche assignée',
        message: `${assignerName} vous a assigné une nouvelle tâche: "${taskTitle}".`,
        recipientId: assigneeId,
        senderId: assignerId,
        senderName: assignerName,
        relatedItemId: taskId,
        relatedItemType: 'task',
        link: `/dashboard?task=${taskId}`
      });
    } catch (error) {
      console.error('Error creating task assignment notification:', error);
      throw error;
    }
  },
  
  // Create task completion notification
  createTaskCompletionNotification: async (
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    assigneeName: string,
    assignerId: string
  ): Promise<void> => {
    try {
      await notificationService.createNotification({
        type: 'task_completed',
        title: 'Tâche terminée',
        message: `${assigneeName} a terminé la tâche: "${taskTitle}".`,
        recipientId: assignerId,
        senderId: assigneeId,
        senderName: assigneeName,
        relatedItemId: taskId,
        relatedItemType: 'task',
        link: `/dashboard?task=${taskId}`
      });
    } catch (error) {
      console.error('Error creating task completion notification:', error);
      throw error;
    }
  }
};

export default notificationService; 