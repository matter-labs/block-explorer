---
sidebar_position: 1
---

# Test documentation


## What you'll need to contribute to the project

- [Node.js](https://nodejs.org/en/download/) version 18.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.

## Project structure rundown
There are few important entities existing in the Docs folder `.` you need to know about:
- `/docs`- Contains the Markdown files and text content for the docs.
- `/static` - Non-documentation files (screenshots/images mostly) that are used in Markdown files.

## How to contribute to project
- Clone [Block Explorer repository](https://github.com/matter-labs/block-explorer)
- Run the next command in the root Block Explorer folder to install all required dependencies, [full installation details](https://docusaurus.io/docs/installation):
```bash
npm install
```
- Go to the root folder
- Run
```bash
npm run build
```
- Run
```bash
npm run serve
```
- Local Docs project will be available at [`http://localhost:3000/docs/intro`](http://localhost:3000/docs/intro)
- Find a page/element you want to edit and proceed with your changes

### Editing Docs
To get familiar with markdonwn features visit [Docusaurus Guides](https://docusaurus.io/docs/markdown-features) page

### Creating a PR
After making changes to the project
- create a pull request with your changes
- make sure all the checks passed (all have to be green)
- request a review from a QAs
  After successull review PR with changes will be merged to main branch
