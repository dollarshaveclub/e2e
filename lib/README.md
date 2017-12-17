
# Architecture

```
run-tests
 |
 ----- run-test-with-retry
            |
            --- run-test (attempt 1)
            |
            --- run-test (attempt 2)
            |
            --- run-test (attempt 3)
```
