module.exports = {
  sendConfirmation: async (email, orderDetails) => {
    if (!email) {
      throw new Error("Email is required to send confirmation");
    }

    console.log(
      `Sending confirmation for order ${orderDetails.id} to ${email}`,
    );
    return true;
  },
};
