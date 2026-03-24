module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.js'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowJs: true,
        types: ['node', 'jest'],
        typeRoots: ['./node_modules/@types', '../backend/node_modules/@types'],
      },
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^stripe$': '<rootDir>/__mocks__/stripe.js',
  },
  moduleDirectories: ['node_modules', '../backend/node_modules'],
  setupFiles: ['<rootDir>/setup.ts'],
  transformIgnorePatterns: ['/node_modules/'],
};
