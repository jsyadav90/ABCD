import API from '../../../services/api';

export const apiService = {
  async generateAssetCode(itemType) {
    await new Promise((r) => setTimeout(r, 150));
    const prefix = String(itemType || "asset").toUpperCase().slice(0, 3);
    const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    return code;
  },
  async createAsset(payload) {
    const response = await API.post('/assets', payload);
    return response.data?.data || response.data;
  },
};
