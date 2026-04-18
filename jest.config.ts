// Path: /jest.config.ts
// Module: Jest Configuration
// Depends on: none
// Description: Base Jest config for unit and integration tests.

import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default config
