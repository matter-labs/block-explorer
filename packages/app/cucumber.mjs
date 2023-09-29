const getWorldParams = () => {
  const params = {
    foo: "bar",
  };

  return params;
};

export default {
  requireModule: ["ts-node/register"],
  paths: ["tests/e2e/features/**/*.feature"],
  require: ["tests/e2e/src/**/*.ts"],
  format: [
    //"json:tests/e2e/reports/cucumber-report.json",
    //"html:tests/e2e/reports/report.html",
    "summary",
    "progress-bar",
    "@cucumber/pretty-formatter",
    "./tests/e2e/src/support/reporters/allure-reporter.js",
  ],
  formatOptions: { snippetInterface: "async-await" },
  worldParameters: getWorldParams(),
  publishQuiet: true,
  retry: 1,
};
