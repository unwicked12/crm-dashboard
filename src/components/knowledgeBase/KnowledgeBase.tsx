import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { knowledgeBaseService, KnowledgeBaseArticle } from '../../services/knowledgeBaseService';
import { useAuth } from '../../contexts/AuthContext';

const categories = [
  'Associations',
  'Documents',
  'Validation',
  'Procédures',
  'Statuts',
  'Paiements',
];

const KnowledgeBase: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [newArticle, setNewArticle] = useState<Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    content: '',
    category: '',
    tags: [],
  });

  const fetchArticles = async () => {
    try {
      setLoading(true);
      let fetchedArticles: KnowledgeBaseArticle[];
      if (searchQuery || selectedCategory) {
        fetchedArticles = await knowledgeBaseService.searchArticles(searchQuery, selectedCategory);
      } else {
        fetchedArticles = await knowledgeBaseService.getAllArticles();
      }
      setArticles(fetchedArticles);
      setError(null);
    } catch (err: any) {
      if (err.message === 'User must be authenticated') {
        setError('Veuillez vous connecter pour accéder à la base de connaissances');
      } else if (err.code === 'permission-denied') {
        setError('Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource');
      } else {
        setError('Erreur lors de la récupération des articles');
        console.error('Error fetching articles:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchArticles();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedCategory]);

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const handleOpenDialog = (article?: KnowledgeBaseArticle) => {
    if (article) {
      setSelectedArticle(article);
      setNewArticle({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
      });
    } else {
      setSelectedArticle(null);
      setNewArticle({
        title: '',
        content: '',
        category: '',
        tags: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedArticle(null);
    setNewArticle({
      title: '',
      content: '',
      category: '',
      tags: [],
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (selectedArticle?.id) {
        await knowledgeBaseService.updateArticle(selectedArticle.id, newArticle);
        setSuccess('Article mis à jour avec succès');
      } else {
        await knowledgeBaseService.createArticle(newArticle);
        setSuccess('Article créé avec succès');
      }
      handleCloseDialog();
      fetchArticles();
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        setError('Vous n\'avez pas les permissions nécessaires pour effectuer cette action');
      } else {
        setError('Erreur lors de l\'enregistrement de l\'article');
        console.error('Error saving article:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        setLoading(true);
        await knowledgeBaseService.deleteArticle(id);
        setSuccess('Article supprimé avec succès');
        fetchArticles();
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          setError('Vous n\'avez pas les permissions nécessaires pour supprimer cet article');
        } else {
          setError('Erreur lors de la suppression de l\'article');
          console.error('Error deleting article:', err);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Base de connaissances</Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Ajouter un article
          </Button>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Rechercher dans la base de connaissances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={selectedCategory}
              label="Catégorie"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">Toutes les catégories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography>Chargement...</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {articles.map((article) => (
          <Grid item xs={12} md={6} lg={4} key={article.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {article.title}
                  </Typography>
                  {user?.role === 'admin' && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(article)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(article.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  Catégorie: {article.category}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                  {article.content}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  {article.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Dernière mise à jour: {article.updatedAt?.toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedArticle ? 'Modifier l\'article' : 'Nouvel article'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Titre"
              value={newArticle.title}
              onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={newArticle.category}
                label="Catégorie"
                onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Contenu"
              multiline
              rows={4}
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Tags (séparés par des virgules)"
              value={newArticle.tags.join(', ')}
              onChange={(e) =>
                setNewArticle({
                  ...newArticle,
                  tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccess(null);
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KnowledgeBase;
