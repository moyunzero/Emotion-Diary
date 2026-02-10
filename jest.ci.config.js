/**
 * Jest 配置：用于 CI / 上架前全量测试
 * 不强制覆盖率阈值，仅以用例通过为准（适合 release 门禁）
 */
const base = require("./jest.config.js");

module.exports = {
  ...base,
  coverageThreshold: undefined,
};
