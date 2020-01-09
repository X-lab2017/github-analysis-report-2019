'use strict';

export type Mode = 'repo' | 'dev' | 'company';
export type Sort = 'act' | 'cnt';

interface IConfig {
  issueCommentWeight: number;
  openIssueWeight: number;
  openPullWeight: number;
  reviewCommentWeight: number;
  pullMergedWeight: number;
  dataFilePath: string;
  outputRepoCount: number;
  onlyChineseRepos: boolean;
  outputMode: Mode;
  sortMode: Sort;
  searchItems: string[];
  showDetail: boolean;
  detailNum: number;
  companyTopN: number[];
}

const config: IConfig = {
  issueCommentWeight: 1,
  openIssueWeight: 2,
  openPullWeight: 3,
  reviewCommentWeight: 4,
  pullMergedWeight: 5,
  dataFilePath: './data/data.json.gz',
  outputRepoCount: 10,
  onlyChineseRepos: false,
  outputMode: 'repo',
  sortMode: 'act',
  searchItems: [],
  showDetail: false,
  detailNum: 10,
  companyTopN: [500, 10000],
};

export default config;
