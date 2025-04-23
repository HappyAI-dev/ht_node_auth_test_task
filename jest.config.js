module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@libs/(.*)$': '<rootDir>/libs/$1',
    '^@web-api/(.*)$': '<rootDir>/src/web-api/$1',
  },
};
