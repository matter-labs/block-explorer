---
tags: ['Artifacts', 'Full test', 'manual', 'Mobile view', 'Pages', 'Smoke test', 'Status Component', 'Transaction', 'Active']
---

# id1687 Tx page - Artifacts -  Pages - Verify status components for Mobile view

## Description

## Precondition


## Scenario
- Open any tx with \<zk Sync Era Processed\> status
- Open "General Info" tab
- "Ethereum Sending" status is displayed
    - Click on "Ethereum Sending"
    - ![Screenshot](../../../../static/img/Pages/Transaction%20page/id1687_1.png)
- Modal window is displayed:
    - **Ethereum network** header
    - **Sending** status present
    - **Validating** status present
    - **Executing** status present
    ![Screenshot](../../../../static/img/Pages/Transaction%20page/id1687_2.png)
- After tx was sent modal window is changed:
    - **Sent** status present
    - **Validated** status present
    - **Executing** status present
    ![Screenshot](../../../../static/img/Pages/Transaction%20page/id1687_3.png)
- After tx was Finalized:
    - **Sent** text (higlhighted)
    - **Validated** text (highlighted)
    - **Executed** text (highlighted)
    ![Screenshot](../../../../static/img/Pages/Transaction%20page/id1687_4.png)
