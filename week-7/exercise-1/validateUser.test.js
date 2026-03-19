const validateUser = require("./validateUser");

describe("validateUser", () => {
  describe("Happy Path", () => {
    it("should return true for a valid user object", () => {
      const validUser = {
        username: "johndoe",
        email: "john@example.com",
        password: "Password123!",
      };
      expect(validateUser(validUser)).toBeTruthy();
    });
  });

  describe("Username Validation", () => {
    it("should throw error if username is missing", () => {
      const user = { email: "t@t.com", password: "P1!" };
      expect(() => validateUser(user)).toThrow(
        "Username must be between 3 and 20 characters",
      );
    });

    it("should throw error if username is less than 3 characters", () => {
      const user = { username: "ab", email: "t@t.com", password: "P1!" };
      expect(() => validateUser(user)).toThrow(
        "Username must be between 3 and 20 characters",
      );
    });

    it("should throw error if username is more than 20 characters", () => {
      const user = {
        username: "a".repeat(21),
        email: "t@t.com",
        password: "P1!",
      };
      expect(() => validateUser(user)).toThrow(
        "Username must be between 3 and 20 characters",
      );
    });
  });

  describe("Email Validation", () => {
    it("should throw error if email is missing", () => {
      const user = { username: "user", password: "Password1!" };
      expect(() => validateUser(user)).toThrow("Invalid email format");
    });

    it("should throw error for invalid email format (missing @)", () => {
      const user = {
        username: "user",
        email: "invalidemail.com",
        password: "Password1!",
      };
      expect(() => validateUser(user)).toThrow("Invalid email format");
    });

    it("should throw error for invalid email format (missing domain)", () => {
      const user = { username: "user", email: "user@", password: "Password1!" };
      expect(() => validateUser(user)).toThrow("Invalid email format");
    });
  });

  describe("Password Validation", () => {
    it("should throw error if password is missing", () => {
      const user = { username: "user", email: "it@it.com" };
      expect(() => validateUser(user)).toThrow(
        "Password must be at least 8 characters long",
      );
    });

    it("should throw error if password is less than 8 characters", () => {
      const user = {
        username: "user",
        email: "it@it.com",
        password: "P1!4567",
      };
      expect(() => validateUser(user)).toThrow(
        "Password must be at least 8 characters long",
      );
    });

    it("should throw error if password has no number", () => {
      const user = {
        username: "user",
        email: "it@it.com",
        password: "Password!",
      };
      expect(() => validateUser(user)).toThrow(
        "Password must contain at least one number",
      );
    });

    it("should throw error if password has no special character", () => {
      const user = {
        username: "user",
        email: "it@it.com",
        password: "Password123",
      };
      expect(() => validateUser(user)).toThrow(
        "Password must contain at least one special character",
      );
    });
  });
});
