import { Repository, Issue, Maybe } from "@octokit/graphql-schema";

// The `trackedInIssues` attribute isn't available on the Issue type in the graphql-schema
// package. It's pretty easy to add manually.
export function getAllIssues(repository: Repository): Maybe<Issue>[] {
  const issues = (repository.pullRequest?.closingIssuesReferences?.nodes ?? []) as Issue[];
  if (!issues?.length) {
    return [];
  }
  const parentIssues = issues
    .flatMap((issue) => issue?.trackedInIssues?.nodes)
    .filter((node) => node) as Issue[];
  issues.push(...parentIssues);

  return issues.map(({ number, labels }) => ({ number, labels })) as Issue[];
}

export function getUniqueLabelsFromIssues(issues: Maybe<Issue>[], exclude?: string[]): string[] {
  const labels = new Set(
    issues
      .flatMap((issue) => issue?.labels?.nodes?.map((node) => node?.name))
      .filter((node) => node) as string[],
  );
  for (const toExclude of exclude ?? []) {
    labels.delete(toExclude);
  }
  return [...labels];
}
