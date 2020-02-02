'use strict';

import { existsSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { isNumber } from 'util';
import yargs from 'yargs';
import config, { Sort } from './config';
import Data, { OperationType } from './data';
import { Processor } from './processor';
import { loadChinese, loadChineseCompanies, logger } from './utils';

export async function main() {

  yargs.locale('en-us');
  const argv = yargs.options({
    f: { type: 'string', default: config.dataFilePath, desc: 'Origin data file path' },
    c: { type: 'number', default: config.issueCommentWeight, desc: 'Issue comment weight' },
    i: { type: 'number', default: config.openIssueWeight, desc: 'Open issue weight' },
    p: { type: 'number', default: config.openPullWeight, desc: 'Open PR weight' },
    r: { type: 'number', default: config.reviewCommentWeight, desc: 'Review comment weight' },
    m: { type: 'number', default: config.pullMergedWeight, desc: 'PR merged weight' },
    n: { type: 'number', default: config.outputRepoCount, desc: 'Output repo count' },
    detail: { type: 'boolean', default: config.showDetail, desc: 'Whether show detail data' },
    detailn: { type: 'number', default: config.detailNum, desc: 'Number to print for detail data' },
    mode: { choices: ['repo', 'dev', 'company'], default: config.outputMode, desc: 'Output mode' },
    search: { type: 'array', default: config.searchItems, desc: 'Search items to output' },
    compTop: { type: 'array', default: config.companyTopN, desc: 'Show top N count for company' },
    sort: { choices: ['act', 'cnt'], default: config.sortMode, desc: 'Order by activity or repo/developer count' },
    ch: { type: 'boolean', default: config.onlyChineseRepos, desc: 'Only show chinese repos' },
  }).argv;

  if (argv.help) {
    yargs.help();
    return;
  }

  logger.info('Start to load data file.');

  if (!existsSync(argv.f)) {
    logger.error(`Origin data file not exists, path =`, argv.f);
    return;
  }

  const processor = new Processor();
  const data = await processor.processFile({
    filePath: argv.f,
    mode: argv.mode,
  });

  logger.info('Load file done, start calculating.');
  // set operation weights
  const weightMap = new Map<OperationType, number>()
    .set(OperationType.ISSUE_COMMNT, argv.c)
    .set(OperationType.OPEN_ISSUE, argv.i)
    .set(OperationType.OPEN_PULL, argv.p)
    .set(OperationType.REVIEW_COMMENT, argv.r)
    .set(OperationType.MERGE_PULL, argv.m);
  // calculate the activity
  data.calc(weightMap, argv.sort as Sort);
  let arr = data.sortedData;
  const companyData = new Data();

  logger.info('Calculate done, total count is', arr.length);
  // print out the results
  const table = [];

  let filterFunc = (_: string) => true;
  if (argv.search.length > 0) {
    // add filter func for search items
    filterFunc = (name: string): boolean => argv.search.some((s) => name.match(s));
  }
  if (argv.mode === 'company') {
    // recalculate company data
    const companies = Array.from(loadChineseCompanies());
    arr.forEach((item) => {
      // repo belongs to a company
      const company = companies.find((c) => c[1].some((r) => item.name.startsWith(r)));
      if (!company) { return; }
      for (let t = OperationType.ISSUE_COMMNT; t <= OperationType.MERGE_PULL; t++) {
        companyData.set(company[0], item.name, item.opCount.get(t) ?? 0, t);
      }
    });
    companyData.calc(weightMap, argv.sort as Sort);
    arr = companyData.sortedData;
  } else if (argv.mode === 'repo' && argv.ch) {
    // add filter func for chinese repos
    const prefixes = loadChinese();
    const oldFilter = filterFunc;
    filterFunc = (name: string) => prefixes.some((s) => name.startsWith(s)) && oldFilter(name);
  }

  const getCountDetail = (opCount: Map<OperationType, number>): any => {
    return {
      'issue comment': opCount.get(OperationType.ISSUE_COMMNT) ?? 0,
      'open issue': opCount.get(OperationType.OPEN_ISSUE) ?? 0,
      'open PR': opCount.get(OperationType.OPEN_PULL) ?? 0,
      'review comment': opCount.get(OperationType.REVIEW_COMMENT) ?? 0,
      'PR merged': opCount.get(OperationType.MERGE_PULL) ?? 0,
    };
  };
  let rank = 0;
  for (let i = 0; i < arr.length; i++) {
    if (argv.n > 0 && rank >= argv.n) {
      break;
    }
    const item = arr[i];
    const globalRank = i + 1;
    if (!filterFunc(item.name)) { continue; }
    rank++;

    if (argv.detail) {
      // show detail data
      item.sort();
      item.sortedData.slice(0, argv.detailn).forEach((detail) => {
        const t: any = {
          '#': rank,
          '#Global': globalRank,
          'name': item.name,
          'sub name': detail.name,
          'activity': detail.activity,
          ...getCountDetail(detail.opCount),
        };
        table.push(t);
      });
    } else {
      // show brief data
      const t: any = {
        '#': rank,
        '#Global': globalRank,
        'name': item.name,
        'activity': item.activity,
        'count': item.data.size,
        ...getCountDetail(item.opCount),
      };
      if (argv.mode === 'company') {
        // if company mode, add some other factor
        if (argv.compTop.length > 0) {
          const companyRepos = Array.from(item.data.keys());
          for (const top of argv.compTop) {
            if (!isNumber(top)) {
              logger.error('Invalid top param', top);
              continue;
            }
            t[`top ${top}`] = companyRepos.filter((r) =>
              data.sortedData.slice(0, top).map((d) => d.name).includes(r)).length;
          }
        }
      }
      table.push(t);
    }
  }

  logger.info('Process done.');
  if (table.length > 0) {
    console.table(table);
    // output to file as csv format
    const keys = Object.keys(table[0]);
    let str = keys.join(',') + EOL;
    table.forEach((record) => {
      keys.forEach((key) => {
        str += record[key] + ',';
      });
      str += EOL;
    });
    writeFileSync(`output-${new Date()}.csv`, str);
  }

  return table;
}

main();
