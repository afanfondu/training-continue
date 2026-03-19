const { processOrder } = require("./orderService");
const inventoryService = require("./inventoryService");
const paymentService = require("./paymentService");
const emailService = require("./emailService");
const db = require("./db");

jest.mock("./inventoryService");
jest.mock("./paymentService");
jest.mock("./emailService");
jest.mock("./db");

describe("orderService", () => {
  const mockOrder = {
    productId: "prod_1",
    quantity: 2,
    amount: 100,
    email: "test@example.com",
    paymentDetails: { card: "1234" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process order successfully", async () => {
    inventoryService.checkStock.mockResolvedValue(true);
    paymentService.charge.mockResolvedValue({
      success: true,
      transactionId: "tx_999",
    });
    db.saveOrder.mockResolvedValue({
      id: "order_123",
      ...mockOrder,
      status: "processed",
      transactionId: "tx_999",
    });
    emailService.sendConfirmation.mockResolvedValue(true);

    const result = await processOrder(mockOrder);

    expect(result).toEqual({
      id: "order_123",
      ...mockOrder,
      status: "processed",
      transactionId: "tx_999",
    });
    expect(inventoryService.checkStock).toHaveBeenCalledWith(
      mockOrder.productId,
      mockOrder.quantity,
    );
    expect(paymentService.charge).toHaveBeenCalledWith(
      mockOrder.amount,
      mockOrder.paymentDetails,
    );
    expect(db.saveOrder).toHaveBeenCalledWith({
      ...mockOrder,
      status: "processed",
      transactionId: "tx_999",
    });
    expect(emailService.sendConfirmation).toHaveBeenCalledWith(
      mockOrder.email,
      result,
    );
  });

  it("should throw error if out of stock", async () => {
    inventoryService.checkStock.mockResolvedValue(false);

    await expect(processOrder(mockOrder)).rejects.toThrow("Out of stock");

    expect(inventoryService.checkStock).toHaveBeenCalled();
    expect(paymentService.charge).not.toHaveBeenCalled();
    expect(db.saveOrder).not.toHaveBeenCalled();
    expect(emailService.sendConfirmation).not.toHaveBeenCalled();
  });

  it("should throw error if payment fails", async () => {
    inventoryService.checkStock.mockResolvedValue(true);
    paymentService.charge.mockResolvedValue({ success: false });

    await expect(processOrder(mockOrder)).rejects.toThrow("Payment failed");

    expect(inventoryService.checkStock).toHaveBeenCalled();
    expect(paymentService.charge).toHaveBeenCalled();
    expect(db.saveOrder).not.toHaveBeenCalled();
    expect(emailService.sendConfirmation).not.toHaveBeenCalled();
  });

  it("should throw error if db save fails", async () => {
    inventoryService.checkStock.mockResolvedValue(true);
    paymentService.charge.mockResolvedValue({
      success: true,
      transactionId: "tx_999",
    });
    db.saveOrder.mockRejectedValue(new Error("DB Error"));

    await expect(processOrder(mockOrder)).rejects.toThrow("DB Error");

    expect(db.saveOrder).toHaveBeenCalled();
    expect(emailService.sendConfirmation).not.toHaveBeenCalled();
  });

  it("should throw error if email sending fails", async () => {
    inventoryService.checkStock.mockResolvedValue(true);
    paymentService.charge.mockResolvedValue({
      success: true,
      transactionId: "tx_999",
    });
    const savedOrder = {
      id: "order_123",
      ...mockOrder,
      status: "processed",
      transactionId: "tx_999",
    };
    db.saveOrder.mockResolvedValue(savedOrder);
    emailService.sendConfirmation.mockRejectedValue(new Error("Email Error"));

    await expect(processOrder(mockOrder)).rejects.toThrow("Email Error");

    expect(emailService.sendConfirmation).toHaveBeenCalledWith(
      mockOrder.email,
      savedOrder,
    );
  });
});
