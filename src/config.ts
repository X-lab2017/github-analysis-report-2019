'use strict';

interface IConfig {
  issueCommentWeight: number;
  openIssueWeight: number;
  openPullWeight: number;
  reviewCommentWeight: number;
  pullMergedWeight: number;
  dataFilePath: string;
  outputRepoCount: number;
  onlyChineseRepos: boolean;
  outputMode: 'repo' | 'dev' | 'company';
}

const config: IConfig = {
  issueCommentWeight: 1,
  openIssueWeight: 2,
  openPullWeight: 3,
  reviewCommentWeight: 4,
  pullMergedWeight: 5,
  dataFilePath: './data/data.json.gz',
  outputRepoCount: 20,
  onlyChineseRepos: false,
  outputMode: 'repo',
};

export default config;
