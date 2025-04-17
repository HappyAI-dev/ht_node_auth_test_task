module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  roots: ["<rootDir>/src"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@web-api/(.*)$": "<rootDir>/src/web-api/$1",
    "^@libs/(.*)$": "<rootDir>/libs/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
}; 