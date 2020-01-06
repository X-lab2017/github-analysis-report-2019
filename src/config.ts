'use strict';

interface IConfig {
  issueCommentWeight: number;
  openIssueWeight: number;
  openPullWeight: number;
  reviewCommentWeight: number;
  pullMergedWeight: number;
  dataFilePath: string;
  outputRepoCount: number;
}

const config: IConfig = {
  issueCommentWeight: 1,
  openIssueWeight: 2,
  openPullWeight: 3,
  reviewCommentWeight: 4,
  pullMergedWeight: 5,
  dataFilePath: './data/data.json.gz',
  outputRepoCount: 10,
};

export default config;
