import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface KnowledgeBaseArticle {
  _id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const createArticle = async (article: KnowledgeBaseArticle) => {
  const response = await axios.post(`${API_URL}/knowledge`, article);
  return response.data;
};

export const getArticles = async (search?: string, category?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  
  const response = await axios.get(`${API_URL}/knowledge`, { params });
  return response.data;
};

export const getArticle = async (id: string) => {
  const response = await axios.get(`${API_URL}/knowledge/${id}`);
  return response.data;
};
