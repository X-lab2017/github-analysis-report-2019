'use strict';

import yargs from 'yargs';
import config from './config';
import { OperationType } from './data';
import { Processor } from './processor';

(async () => {

  yargs.locale('en-us');
  const argv = yargs.options({
    c: { type: 'number', default: config.issueCommentWeight, desc: 'Issue comment weight' },
    i: { type: 'number', default: config.openIssueWeight, desc: 'Open issue weight' },
    p: { type: 'number', default: config.openPullWeight, desc: 'Open PR weight' },
    r: { type: 'number', default: config.reviewCommentWeight, desc: 'Review comment weight' },
    m: { type: 'number', default: config.pullMergedWeight, desc: 'PR merged weight' },
    f: { type: 'string', default: config.dataFilePath, desc: 'Origin data file path' },
    n: { type: 'number', default: config.outputRepoCount, desc: 'Output repo count' },
  }).argv;

  if (argv.help) {
    yargs.help();
    return;
  }

  const processor = new Processor();
  const data = await processor.processFile(argv.f);

  // set operation weights
  const weightMap = new Map<OperationType, number>()
    .set(OperationType.ISSUE_COMMNT, argv.c)
    .set(OperationType.OPEN_ISSUE, argv.i)
    .set(OperationType.OPEN_PULL, argv.p)
    .set(OperationType.REVIEW_COMMENT, argv.r)
    .set(OperationType.MERGE_PULL, argv.m);
  // calculate the activity
  data.calc(weightMap);

  // print out the results
  data.print(argv.n);
})();
