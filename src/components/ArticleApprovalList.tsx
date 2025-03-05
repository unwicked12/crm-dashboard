import React, { useEffect, useState } from 'react';
import { KnowledgeBaseArticle } from '../services/knowledgeBaseService';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, Card, CardContent, Typography, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

// Helper function to safely format dates
const formatDate = (dateValue: any): string => {
  try {
    if (!dateValue) return 'Unknown date';
    
    // If it's a Firestore Timestamp
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
      return formatDistanceToNow((dateValue as { toDate(): Date }).toDate(), { addSuffix: true });
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      return formatDistanceToNow(dateValue, { addSuffix: true });
    }
    
    // If it's an ISO string
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    }
    
    // Default fallback
    return 'Unknown date';
  } catch (error) {
    console.error('Error formatting date:', error, dateValue);
    return 'Unknown date';
  }
};

const ArticleApprovalList: React.FC = () => {
  const [pendingArticles, setPendingArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Function to get pending articles
  const getPendingArticles = async (): Promise<KnowledgeBaseArticle[]> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }
    
    try {
      const articlesRef = collection(db, 'knowledgeBase');
      const q = query(articlesRef, where('approvalStatus', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const articles: KnowledgeBaseArticle[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data() as Omit<KnowledgeBaseArticle, 'id'>;
        
        // Ensure dates are properly converted
        let createdAt: Date;
        if (data.createdAt) {
          if (typeof data.createdAt === 'object' && 'toDate' in data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAt = (data.createdAt as { toDate(): Date }).toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            createdAt = new Date(data.createdAt);
          } else {
            createdAt = new Date();
          }
        } else {
          createdAt = new Date();
        }
        
        let updatedAt: Date;
        if (data.updatedAt) {
          if (typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            updatedAt = (data.updatedAt as { toDate(): Date }).toDate();
          } else if (data.updatedAt instanceof Date) {
            updatedAt = data.updatedAt;
          } else if (typeof data.updatedAt === 'string') {
            updatedAt = new Date(data.updatedAt);
          } else {
            updatedAt = new Date();
          }
        } else {
          updatedAt = new Date();
        }
        
        articles.push({ 
          id: doc.id, 
          ...data,
          createdAt,
          updatedAt
        });
      });
      
      return articles;
    } catch (error) {
      console.error('Error getting pending articles:', error);
      throw error;
    }
  };

  // Function to update article approval status
  const updateArticleApprovalStatus = async (articleId: string, status: 'approved' | 'rejected'): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }
    
    try {
      const articleRef = doc(db, 'knowledgeBase', articleId);
      await updateDoc(articleRef, {
        approvalStatus: status,
        updatedAt: new Date().toISOString()
      });
      
      // Removed console.log
    } catch (error) {
      console.error(`Error updating article status to ${status}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchPendingArticles = async () => {
      try {
        setLoading(true);
        const articles = await getPendingArticles();
        setPendingArticles(articles);
        setError(null);
      } catch (err) {
        console.error('Error fetching pending articles:', err);
        setError('Failed to load pending articles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingArticles();
  }, []);

  const handleApprove = async (articleId: string) => {
    try {
      await updateArticleApprovalStatus(articleId, 'approved');
      setPendingArticles(pendingArticles.filter(article => article.id !== articleId));
    } catch (err) {
      console.error('Error approving article:', err);
      setError('Failed to approve article. Please try again.');
    }
  };

  const handleReject = async (articleId: string) => {
    try {
      await updateArticleApprovalStatus(articleId, 'rejected');
      setPendingArticles(pendingArticles.filter(article => article.id !== articleId));
    } catch (err) {
      console.error('Error rejecting article:', err);
      setError('Failed to reject article. Please try again.');
    }
  };

  const handleViewArticle = (articleId: string) => {
    navigate(`/knowledge-base/article/${articleId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (pendingArticles.length === 0) {
    return <Alert severity="info">No pending articles to approve.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Pending Articles ({pendingArticles.length})
      </Typography>
      <Grid container spacing={3}>
        {pendingArticles.map((article) => (
          <Grid item xs={12} key={article.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{article.title}</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  By {article.authorName} • {formatDate(article.createdAt)}
                </Typography>
                <Box my={1}>
                  <Chip label={article.category} size="small" color="primary" />
                  {article.tags && article.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" style={{ marginLeft: 4 }} />
                  ))}
                </Box>
                <Typography variant="body2" noWrap style={{ maxWidth: '100%' }}>
                  {article.summary || article.content.substring(0, 150)}...
                </Typography>
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small" 
                    onClick={() => handleViewArticle(article.id || '')}
                    style={{ marginRight: 8 }}
                  >
                    View
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    onClick={() => handleApprove(article.id || '')}
                    style={{ marginRight: 8 }}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small" 
                    onClick={() => handleReject(article.id || '')}
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ArticleApprovalList; 