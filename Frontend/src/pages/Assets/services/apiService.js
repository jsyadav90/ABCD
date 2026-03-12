import API from '../../../services/api';

export const apiService = {
  async createAsset(payload) {
    const response = await API.post('/assets', payload);
    return response.data?.data || response.data;
  },
};
