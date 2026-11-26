/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  testRunner: "vitest",
  reporters: ["clear-text", "progress", "html"],
  coverageAnalysis: "perTest",
  mutate: [
    "app/src/lib/**/*.ts",
    "!app/src/lib/**/*.test.ts",
  ],
  vitest: {
    configFile: "vitest.config.ts",
  },
  thresholds: {
    high: 85,
    low: 70,
    break: 60,
  },
};

export default config;
