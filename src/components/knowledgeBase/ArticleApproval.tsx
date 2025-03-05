import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import ArticleApprovalList from '../ArticleApprovalList';

const ArticleApproval: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Only administrators can access the article approval section.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Knowledge Base Article Approval
      </Typography>
      <ArticleApprovalList />
    </Box>
  );
}

export default ArticleApproval; 