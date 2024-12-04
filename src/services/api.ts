import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Activity API calls
export const createActivity = async (activityData: any) => {
  const response = await axios.post(`${API_URL}/activity`, activityData);
  return response.data;
};

export const getActivities = async (userId: string) => {
  const response = await axios.get(`${API_URL}/activity/${userId}`);
  return response.data;
};

// Request API calls
export const createRequest = async (requestData: any) => {
  const response = await axios.post(`${API_URL}/requests`, requestData);
  return response.data;
};

export const getRequests = async (userId: string) => {
  const response = await axios.get(`${API_URL}/requests/${userId}`);
  return response.data;
};

export const updateRequest = async (requestId: string, updateData: any) => {
  const response = await axios.patch(`${API_URL}/requests/${requestId}`, updateData);
  return response.data;
};
