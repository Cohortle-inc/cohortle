const fc = require('fast-check');

// Mock the resend client before importing ResendService
jest.mock('../../lib/resend', () => ({
  emails: {
    send: jest.fn()
  }
}));

const { isValidEmail } = require('../../services/ResendService');

describe('Feature: resend-email-integration, Property 1: Email validation rejects invalid formats', () => {
  test('should reject strings without @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')),
        (invalidEmail) => {
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should reject strings without domain', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.includes('@') && !s.includes('.')),
        (invalidEmail) => {
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should reject strings with @ but no local part', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0),
        (domain) => {
          const invalidEmail = `@${domain}`;
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should reject strings with @ but no domain part', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && !s.includes('@')),
        (localPart) => {
          const invalidEmail = `${localPart}@`;
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should reject empty strings and null/undefined', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  test('should reject strings with whitespace', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (validEmail) => {
          const emailWithSpace = validEmail.replace('@', ' @');
          expect(isValidEmail(emailWithSpace)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should accept valid email formats', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (validEmail) => {
          expect(isValidEmail(validEmail)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should accept emails with subdomains', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
        fc.string({ minLength: 2, maxLength: 5 }).filter(s => /^[a-z]+$/.test(s)),
        (local, subdomain, domain, tld) => {
          const email = `${local}@${subdomain}.${domain}.${tld}`;
          expect(isValidEmail(email)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should accept emails with plus addressing', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
        (baseEmail, tag) => {
          const [local, domain] = baseEmail.split('@');
          const emailWithTag = `${local}+${tag}@${domain}`;
          expect(isValidEmail(emailWithTag)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('should accept emails with dots in local part', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9]+$/.test(s)),
        fc.emailAddress(),
        (part1, part2, baseEmail) => {
          const domain = baseEmail.split('@')[1];
          const email = `${part1}.${part2}@${domain}`;
          expect(isValidEmail(email)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});
