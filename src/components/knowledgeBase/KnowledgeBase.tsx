// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Bookmark as BookmarkIcon,
  Public as PublicIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { knowledgeBaseService, KnowledgeBaseArticle, ArticleCategory, ArticleType } from '../../services/knowledgeBaseService';
import { useAuth } from '../../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useParams, useNavigate } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CATEGORIES: ArticleCategory[] = ['Contrats', 'Paiements', 'Compliance', 'Support'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const KnowledgeBase: React.FC = () => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: articleId } = useParams<{ id: string }>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | ''>('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedType, setSelectedType] = useState<'all' | 'personal' | 'general'>('all');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [keywords, setKeywords] = useState<string>('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editDialogOpen, setEditDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editArticle, setEditArticle] = useState<KnowledgeBaseArticle | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [newArticle, setNewArticle] = useState<Partial<KnowledgeBaseArticle>>({
    title: '',
    content: '',
    category: 'Support',
    tags: [],
    type: 'personal',
    visibility: 'public'
  });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchArticles = async () => {
    try {
      // Removed console.log
      // Removed console.log
      
      setLoading(true);
      setError(null);
      
      const data = await knowledgeBaseService.getAllArticles();
      // Removed console.log
      
      setArticles(data);
    } catch (error) {
      console.error('[KnowledgeBase] Error fetching articles:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchArticleById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const article = await knowledgeBaseService.getArticleById(id);
      if (article) {
        setSelectedArticle(article);
        setViewDialogOpen(true);
      } else {
        setError('Article not found');
        navigate('/knowledge-base');
      }
    } catch (error) {
      console.error('[KnowledgeBase] Error fetching article:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch article');
      navigate('/knowledge-base');
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Removed console.log
    if (user) {
      // Removed console.log
      fetchArticles();
      
      if (articleId) {
        fetchArticleById(articleId);
      }
    } else {
      // Removed console.log
      setError('Please sign in to view articles');
      setLoading(false);
    }
  }, [user, articleId]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getFilteredArticles = () => {
    return articles.filter(article => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const matchesSearch = searchQuery === '' || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || article.category === selectedCategory;
      
      const matchesType = selectedType === 'all' || 
        (selectedType === 'personal' && article.authorId === user?.uid) ||
        (selectedType === 'general' && article.type === 'general');

      const matchesKeywords = !keywords || keywords.split(',').some(keyword => 
        article.tags.some(tag => tag.toLowerCase().includes(keyword.trim().toLowerCase())) ||
        article.title.toLowerCase().includes(keyword.trim().toLowerCase()) ||
        article.content.toLowerCase().includes(keyword.trim().toLowerCase())
      );

      // Only show private articles to their author
      const matchesVisibility = article.visibility === 'public' || article.authorId === user?.uid;

      return matchesSearch && matchesCategory && matchesType && matchesKeywords && matchesVisibility;
    });
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (articleId?: string) => {
    if (!articleId || !window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await knowledgeBaseService.deleteArticle(articleId);
      await fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewArticle = (article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setViewDialogOpen(true);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedArticle(null);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateArticle = async () => {
    try {
      if (!user) return;
      
      const articleToCreate = {
        ...newArticle,
        authorId: user.uid,
        authorName: user.name || 'Unknown',
        tags: newArticle.tags || [],
      } as Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>;

      await knowledgeBaseService.createArticle(articleToCreate);
      await fetchArticles();
      setCreateDialogOpen(false);
      setNewArticle({
        title: '',
        content: '',
        category: 'Support',
        tags: [],
        type: 'personal',
        visibility: 'public'
      });
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (article: KnowledgeBaseArticle) => {
    setEditArticle(article);
    setEditDialogOpen(true);
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateArticle = async () => {
    if (!editArticle?.id) return;

    try {
      setLoading(true);
      await knowledgeBaseService.updateArticle(editArticle.id, {
        title: editArticle.title,
        content: editArticle.content,
        category: editArticle.category,
        tags: editArticle.tags,
        type: editArticle.type
      });
      await fetchArticles();
      setEditDialogOpen(false);
      setEditArticle(null);
    } catch (error) {
      console.error('Error updating article:', error);
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredArticles = getFilteredArticles();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Base de connaissances
        </Typography>
        {user && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Nouvel article
          </Button>
        )}
      </Stack>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher..."
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mots-clés"
              placeholder="Séparer par des virgules"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              helperText="Ex: contrat, validation, procédure"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={selectedCategory}
                label="Catégorie"
                onChange={(e) => setSelectedCategory(e.target.value as ArticleCategory | '')}
              >
                <MenuItem value="">Toutes</MenuItem>
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                label="Type"
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'personal' | 'general')}
              >
                <MenuItem value="all">Tous les articles</MenuItem>
                <MenuItem value="personal">Mes articles</MenuItem>
                <MenuItem value="general">Articles généraux</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>Chargement des articles...</Typography>
        </Box>
      ) : filteredArticles.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography color="text.secondary">
            Aucun article trouvé pour ces critères
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredArticles.map((article) => (
            <Grid item xs={12} sm={6} md={4} key={article.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {article.title}
                  </Typography>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Chip
                      size="small"
                      icon={article.type === 'personal' ? <BookmarkIcon /> : <PublicIcon />}
                      label={article.type === 'personal' ? 'Personnel' : 'Général'}
                    />
                    <Chip
                      size="small"
                      label={article.category}
                    />
                    {article.type === 'personal' && (
                      <Chip
                        size="small"
                        icon={article.visibility === 'public' ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        label={article.visibility === 'public' ? 'Visible pour tous' : 'Privé'}
                      />
                    )}
                    {user?.uid === article.authorId && (
                      <Chip
                        size="small"
                        color={
                          article.approvalStatus === 'approved' 
                            ? 'success' 
                            : article.approvalStatus === 'rejected' 
                              ? 'error' 
                              : 'warning'
                        }
                        label={
                          article.approvalStatus === 'approved' 
                            ? 'Approuvé' 
                            : article.approvalStatus === 'rejected' 
                              ? 'Rejeté' 
                              : 'En attente'
                        }
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {article.content.substring(0, 150)}...
                  </Typography>
                  <Stack direction="row" spacing={1} mb={2}>
                    {article.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Par {article.authorName} • {format(article.createdAt || new Date(), 'dd/MM/yyyy')}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    {(user?.role === 'admin' || user?.uid === article.authorId) && (
                      <>
                        <Button
                          startIcon={<EditIcon />}
                          size="small"
                          onClick={() => handleEdit(article)}
                        >
                          Modifier
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(article.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleViewArticle(article)}
                      sx={{ ml: 'auto' }}
                    >
                      Voir plus
                    </Button>
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View Article Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedArticle && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{selectedArticle.title}</Typography>
                <IconButton onClick={handleCloseDialog} size="small">
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    icon={selectedArticle.type === 'personal' ? <BookmarkIcon /> : <PublicIcon />}
                    label={selectedArticle.type === 'personal' ? 'Personnel' : 'Général'}
                  />
                  <Chip
                    size="small"
                    label={selectedArticle.category}
                  />
                </Stack>
                
                <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
                  {selectedArticle.content}
                </DialogContentText>

                <Stack direction="row" spacing={1}>
                  {selectedArticle.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  Par {selectedArticle.authorName} • {format(selectedArticle.createdAt || new Date(), 'dd/MM/yyyy')}
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Article Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nouvel article</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Titre"
              value={newArticle.title}
              onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Contenu"
              multiline
              rows={6}
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={newArticle.category}
                label="Catégorie"
                onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value as ArticleCategory })}
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Tags"
              placeholder="Séparer par des virgules"
              value={newArticle.tags?.join(', ')}
              onChange={(e) => setNewArticle({ 
                ...newArticle, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '') 
              })}
              helperText="Ex: contrat, validation, procédure"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newArticle.type}
                label="Type"
                onChange={(e) => setNewArticle({ ...newArticle, type: e.target.value as 'personal' | 'general' })}
              >
                <MenuItem value="personal">Personnel</MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem value="general">Général</MenuItem>
                )}
              </Select>
            </FormControl>
            {newArticle.type === 'personal' && (
              <FormControl fullWidth>
                <InputLabel>Visibilité</InputLabel>
                <Select
                  value={newArticle.visibility}
                  label="Visibilité"
                  onChange={(e) => setNewArticle({ ...newArticle, visibility: e.target.value as 'public' | 'private' })}
                  startAdornment={
                    <InputAdornment position="start">
                      {newArticle.visibility === 'public' ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </InputAdornment>
                  }
                >
                  <MenuItem value="public">Visible pour tous</MenuItem>
                  <MenuItem value="private">Visible uniquement pour moi</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateArticle}
            disabled={!newArticle.title || !newArticle.content || !newArticle.category}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Modifier l'article</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Titre"
              value={editArticle?.title || ''}
              onChange={(e) => setEditArticle(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
            <TextField
              fullWidth
              label="Contenu"
              multiline
              rows={6}
              value={editArticle?.content || ''}
              onChange={(e) => setEditArticle(prev => prev ? { ...prev, content: e.target.value } : null)}
            />
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={editArticle?.category || ''}
                label="Catégorie"
                onChange={(e) => setEditArticle(prev => prev ? { ...prev, category: e.target.value as ArticleCategory } : null)}
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Tags"
              placeholder="Séparer par des virgules"
              value={editArticle?.tags.join(', ') || ''}
              onChange={(e) => setEditArticle(prev => prev ? {
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
              } : null)}
              helperText="Ex: contrat, validation, procédure"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={editArticle?.type || 'personal'}
                label="Type"
                onChange={(e) => setEditArticle(prev => prev ? { ...prev, type: e.target.value as 'personal' | 'general' } : null)}
              >
                <MenuItem value="personal">Personnel</MenuItem>
                {user?.role === 'admin' && (
                  <MenuItem value="general">Général</MenuItem>
                )}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateArticle}
            disabled={!editArticle?.title || !editArticle?.content || !editArticle?.category}
          >
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KnowledgeBase;