/**
 * The suite imports the subject under test through the package name `easy-web-worker`.
 * EASY_WEB_WORKER_TEST_TARGET picks what that name resolves to:
 *   - src  (default): the TypeScript source
 *   - dist: the built, publishable package in ./dist (run `yarn build` first)
 */
const target = process.env.EASY_WEB_WORKER_TEST_TARGET === 'dist' ? 'dist' : 'src';

const moduleNameMapper =
  target === 'dist'
    ? {
        '^easy-web-worker$': '<rootDir>/dist/bundle.cjs',
        '^easy-web-worker/(.*)$': '<rootDir>/dist/$1.cjs',
      }
    : {
        '^easy-web-worker$': '<rootDir>/src/index.ts',
        '^easy-web-worker/(.*)$': '<rootDir>/src/$1',
      };

module.exports = {
  displayName: `easy-web-worker (${target})`,
  testEnvironment: 'node',
  maxWorkers: 4,
  watchman: false,
  testMatch: ['<rootDir>/__test__/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/package.json'],
  collectCoverageFrom: ['<rootDir>/src/*.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/__test__/tsconfig.json' }],
  },
};
