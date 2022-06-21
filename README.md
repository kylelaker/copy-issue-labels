# Copy issue labels to a pull request

This Action copies all labels from the issues linked to a pull request as well as the labels
of any parent issues.

## Usage

This sample workflow can be used to copy labels to all pull requests opened on the repository.
It will exclude the `good first issue` and `help wanted` labels from being applied automatically
to pull requests.

```yaml
---
on:
  pull_request_target:
    types:
      # There isn't a specific event for linking an issue; however, most of the
      # time those will be part of the opened or edited events.
      - opened
      - edited

permissions:
  # Required to read labels from issues
  issues: read
  # Required to set labels on the pull request
  pull-requests: write

jobs:
  copy_labels:
    name: Copy labels to PR
    runs-on: ubuntu-latest
    steps:
      - name: Apply labels
        uses: kylelaker/copy-issue-labels@v1
        with:
          exclude-labels: "good first issue,help wanted"
```
