// Validation helper
export function validateText(text) {
  // Type check
  if (typeof text !== 'string') {
    return { valid: false, error: 'Dream text must be a string' };
  }

  // Sanitization: trim whitespace
  const trimmed = text.trim();

  // Required field check
  if (trimmed.length === 0) {
    return { valid: false, error: 'Dream text is required' };
  }

  // Length limit check
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Dream text must be less than 5000 characters' };
  }

  return { valid: true, value: trimmed };
}