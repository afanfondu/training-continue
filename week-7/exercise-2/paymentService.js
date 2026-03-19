module.exports = {
  charge: async (amount, paymentDetails) => {
    if (!paymentDetails || !paymentDetails.card) {
      return { success: false, error: 'Invalid payment details' };
    }
    
    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than zero' };
    }
    
    return { 
      success: true, 
      transactionId: `tx_${Math.random().toString(36).substring(2, 9)}` 
    };
  }
};
