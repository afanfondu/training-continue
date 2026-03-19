const inventoryService = require('./inventoryService');
const paymentService = require('./paymentService');
const emailService = require('./emailService');
const db = require('./db');

async function processOrder(order) {
  const { productId, quantity, amount, email, paymentDetails } = order;

  const isStockAvailable = await inventoryService.checkStock(productId, quantity);
  if (!isStockAvailable) {
    throw new Error('Out of stock');
  }

  const paymentResult = await paymentService.charge(amount, paymentDetails);
  if (!paymentResult.success) {
    throw new Error('Payment failed');
  }

  const savedOrder = await db.saveOrder({
    ...order,
    status: 'processed',
    transactionId: paymentResult.transactionId
  });

  await emailService.sendConfirmation(email, savedOrder);

  return savedOrder;
}

module.exports = { processOrder };
