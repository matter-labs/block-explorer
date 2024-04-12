---
tags: ['Artifacts', 'Common', 'Full test', 'main page', 'regression', 'Active']
---

# id697 Common - Check metadata of the page (UA)

## Description
  - Environment:https://goerli-beta.staging-scan-v2.zksync.dev/

## Precondition


## Scenario
- Open the Environment page
- Check that language is set to ENG
- Open Dev Chrome Tools (F12)
    - Open Elements tab
- Check that we have \<title\>Транзакції, Блоки, Контракти та інше | zkSync 2.0 Провідник\</title\>
- Open new tab in the browser
    - Hover mouse over the tab with opened environment (step 1)
- Check that we have correct description "Транзакції, Блоки, Контракти та інше | zkSync 2.0 Провідник"
- Check the description of the block explorer
    - Title: "zkSync Era Провідник"
- Description: "Переглядайте в режимі реального часу інформацію про блоки, транзакції, контракти та іншу активність у мережі."
