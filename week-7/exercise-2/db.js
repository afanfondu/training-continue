module.exports = {
  saveOrder: async (order) => {
    if (!order.productId || !order.amount) {
      throw new Error('Invalid order data structure');
    }
    
    const id = `order_${Date.now()}`;
    return { id, ...order, createdAt: new Date().toISOString() };
  }
};
