const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/__tests__/**/*.pbt.[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(isomorphic-dompurify|@exodus)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)