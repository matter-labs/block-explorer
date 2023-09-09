const { CucumberJSAllureFormatter } = require("allure-cucumberjs8");
const { AllureRuntime } = require("allure-cucumberjs8");
function Reporter(options) {
  return new CucumberJSAllureFormatter(options, new AllureRuntime({ resultsDir: "./allure-results" }), {});
}
Reporter.prototype = Object.create(CucumberJSAllureFormatter.prototype);
Reporter.prototype.constructor = Reporter;

exports.default = Reporter;
