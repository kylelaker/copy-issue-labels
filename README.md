# Copy issue labels to a pull request

This Action copies all labels from the issues linked to a pull request as well as the labels
of any parent issues.

## Usage

This 

```yaml
on:
  pull_request_target:

permissions:
  # Required to read labels from issues
  issues: read
  # Required to set labels on the pull request
  pull-requests: write

jobs:
  copy_labels:
    runs-on: ubuntu-latest
    steps:
      - name: Apply labels
        uses: kylelaker/copy-issue-labels@v1
        with:
          exclude-labels: "good first issue"
```
