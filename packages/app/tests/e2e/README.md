# The test solution for BlockExplorer v2 E2E testing

Based on Playwright.io/TypeScript/BDD

## Recommended E2E pre-test setup

Before the execution of the end-2-end tests there needs to install dependencies:

```bash
npm install
```

## How to run E2E tests

--
all tests:
```bash
npx cucumber-js
```
or

```bash
npm run test:e2e
```

--
tests by specified tags (eg, @title): 
```bash
npx cucumber-js --tags @title   
```
## Variables

process.env.TARGET_ENV:
  set up the target URL environment for the test run. Default value is stage https://staging-scan-v2.zksync.dev

## Reports
Reports are configured in Cucumber.mjs file and results after test runs might be gotten by the next one approaches: 

Cucumber reports:

- uncomment lines in cucumber.mjs file
   // "json:tests/e2e/reports/cucumber-report.json",
   // "html:tests/e2e/reports/report.html",

- run the script below
```bash
open tests/e2e/reports/report.html 
```
Allure reports: 

It's working on CI/CD. The results are collected in allure-results folder. Every test run generate appropriate test result data in JSON format. 

## Tags 
Tags allow to separate the current feature scope to appropriate suits, eg:

@smoke
@sanity
@regression:small
@regression:all

Tags should be pasted above the "Feature" or "Scenario" key-word