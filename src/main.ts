import * as core from "@actions/core";
import * as github from "@actions/github";
import { Repository } from "@octokit/graphql-schema";
import { getAllIssues, getUniqueLabelsFromIssues } from "./labels";

const GET_LABEL_QUERY = `query ($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      closingIssuesReferences(first: 5) {
        nodes {
          number
          labels(first: 25) {
            nodes {
              name
            }
          }
          trackedInIssues(first: 5) {
            nodes {
              number,
              labels(first: 25) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
}`;

async function run(): Promise<void> {
  try {
    const token = core.getInput("token");
    const excludeLabels = core
      .getInput("exclude-labels")
      .split(",")
      .map((item) => item.trim());
    const octokit = github.getOctokit(token);

    const { repository } = await octokit.graphql<{ repository: Repository }>(GET_LABEL_QUERY, {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      number: github.context.payload.pull_request?.number,
    });

    const issues = getAllIssues(repository);
    if (!issues.length) {
      core.info("No related issues found");
      return;
    }

    core.info(`Getting labels from ${issues.map((issue) => issue?.number).join(", ")}`);

    const labels = getUniqueLabelsFromIssues(issues, excludeLabels);
    if (!labels.length) {
      core.info("Related issues had no tags");
      return;
    }

    core.info(`Applying labels: ${labels.join(",")}`);
    await octokit.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.payload.pull_request!.number,
      labels: [...labels],
    });
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
