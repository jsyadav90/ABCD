export const apiService = {
  async generateAssetCode(itemType) {
    await new Promise((r) => setTimeout(r, 150));
    const prefix = String(itemType || "asset").toUpperCase().slice(0, 3);
    const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    return code;
  },
  async createAsset(data) {
    await new Promise((r) => setTimeout(r, 250));
    return { success: true, id: Math.floor(Math.random() * 1000000), data };
  },
};
