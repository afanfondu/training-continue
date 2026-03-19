function validateUser(user) {
  const { email, password, username } = user;

  if (!username || username.length < 3 || username.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasNumber) {
    throw new Error('Password must contain at least one number');
  }

  if (!hasSpecialChar) {
    throw new Error('Password must contain at least one special character');
  }

  return true;
}

module.exports = validateUser;
