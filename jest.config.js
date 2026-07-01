/**
 * Jest is configured to run only the pure-logic unit tests headlessly in Node.
 * These modules (src/lib, src/services, src/store, src/config) deliberately
 * avoid importing React Native so they can be tested without a device or the
 * heavy RN/Expo transform pipeline.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Loosen for the test transform only; app code is checked via `npm run typecheck`.
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
};
