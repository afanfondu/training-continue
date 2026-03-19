module.exports = {
  checkStock: async (productId, quantity) => {
    const mockDb = {
      'prod_1': 10,
      'prod_2': 0
    };
    const currentStock = mockDb[productId] || 0;
    return currentStock >= quantity;
  }
};
