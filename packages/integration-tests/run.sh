#!/bin/bash

echo "Test run"
npx jest --verbose --testPathPattern=tokens.test.ts
npx jest --verbose --testPathPattern=deposit.test.ts
npx jest --verbose --testPathPattern=common
npx jest --verbose --testPathPattern=transactions