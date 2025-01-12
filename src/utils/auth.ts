import { getAuth } from 'firebase/auth';

export const getAuthHeader = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    return {
      Authorization: `Bearer ${user.getIdToken()}`
    };
  }
  
  return {};
};
