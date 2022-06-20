import { Repository } from "@octokit/graphql-schema";
import { Issue, getUniqueLabelsFromIssues, getAllIssues } from "../src/labels";

function createIssue(number: number, labels: string[], trackedInIssues?: Issue[]): Issue {
  return {
    number,
    labels: {
      nodes: labels.map((name) => ({ name })),
    },
    trackedInIssues: {
      nodes: trackedInIssues ?? [],
    },
  } as any as Issue;
}

function createResult(linkedIssues: Issue[]): any {
  return {
    pullRequest: {
      closingIssuesReferences: {
        nodes: linkedIssues,
      },
    },
  };
}

function issueWithoutTracking(issue: Issue): Issue {
  return {
    number: issue.number,
    labels: issue.labels,
  } as any as Issue;
}

const emptyResult = createResult([]);
const oneLinkedIssueWithLabelsNotTracked = createResult([createIssue(1, ["test1", "test2"])]);
const oneLinkedIssueWithLabelsTracked = createResult([
  createIssue(2, ["child1", "child2"], [createIssue(1, ["parent"])]),
]);

function createComplexStructure(): { graphqlResult: any; expectedTags: string[] } {
  const issue1 = createIssue(1, ["javascript", "documentation"]);
  const issue2 = createIssue(2, []);
  return {
    // The general structure is:
    //  Issue #2 has no labels; subtasks are 5 and 6, each with their own labels (some overlap)
    //  Issue #1 has some labels; it has subtasks (7, 8, 9) with their own labels (some don't have labels)
    //  Issue #10 has labels but no parent task
    //  Issue #14 has no labels and no parent task
    //  The PR itself closes 5, 6, 7, 8, 9, and 14.
    graphqlResult: createResult([
      createIssue(5, ["bug", "javascript"], [issue2]),
      createIssue(6, ["good first issue", "bug"], [issue2]),
      createIssue(7, [], [issue1]),
      createIssue(8, ["enhancement"], [issue1]),
      createIssue(9, ["enhancement", "documentation"], [issue1]),
      createIssue(10, ["documentation", "javascript"]),
      createIssue(14, []),
    ]),
    expectedTags: ["bug", "javascript", "good first issue", "enhancement", "documentation"],
  };
}

describe("Validate parsing of Issues from the GraphQL API", () => {
  it("should return an empty list when no issue is referenced", async () => {
    expect(getAllIssues(emptyResult as Repository)).toEqual([]);
  });
  it("should return the linked issue when there is only one", async () => {
    expect(getAllIssues(oneLinkedIssueWithLabelsNotTracked as Repository)).toEqual(
      oneLinkedIssueWithLabelsNotTracked.pullRequest.closingIssuesReferences.nodes.map(
        issueWithoutTracking,
      ),
    );
  });
  it("should return the parent and the linked issue", async () => {
    expect(getAllIssues(oneLinkedIssueWithLabelsTracked as Repository)).toEqual([
      issueWithoutTracking(createIssue(2, ["child1", "child2"])),
      issueWithoutTracking(createIssue(1, ["parent"])),
    ]);
  });
});

describe("Validate getting labels from Issues", () => {});

const realExample = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: [
          {
            number: 11,
            labels: {
              nodes: [],
            },
            trackedInIssues: {
              nodes: [
                {
                  number: 10,
                  labels: {
                    nodes: [
                      {
                        name: "question",
                      },
                      {
                        name: "javascript",
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            number: 12,
            labels: {
              nodes: [],
            },
            trackedInIssues: {
              nodes: [
                {
                  number: 10,
                  labels: {
                    nodes: [
                      {
                        name: "question",
                      },
                      {
                        name: "javascript",
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            number: 15,
            labels: {
              nodes: [
                {
                  name: "bug",
                },
              ],
            },
            trackedInIssues: {
              nodes: [],
            },
          },
        ],
      },
    },
  },
};

describe("Validate getting all labels from GraphQL response", () => {
  it("should work using a real example", async () => {
    expect(
      getUniqueLabelsFromIssues(getAllIssues(realExample.repository as any as Repository)),
    ).toEqual(["bug", "question", "javascript"]);
  });
  const complexTest = createComplexStructure();
  it.each([
    { input: realExample.repository, expected: ["bug", "question", "javascript"] },
    { input: emptyResult, expected: [] },
    { input: oneLinkedIssueWithLabelsNotTracked, expected: ["test1", "test2"] },
    { input: oneLinkedIssueWithLabelsTracked, expected: ["child1", "child2", "parent"] },
    { input: complexTest.graphqlResult, expected: complexTest.expectedTags },
  ])("should return correct inputs for test data", async ({ input, expected }) => {
    expect(getUniqueLabelsFromIssues(getAllIssues(input)).sort()).toEqual(expected.sort());
  });
});
