'use strict';

import yargs from 'yargs';
import config from './config';
import { OperationType } from './data';
import { Processor } from './processor';
import { loadChinese, loadChineseCompanies } from './utils';

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
    top: { type: 'number', default: 10, desc: 'Number to print for detail data' },
    mode: { choices: ['repo', 'dev', 'company'], default: config.outputMode, desc: 'Output mode' },
    dev: { type: 'array', default: [], desc: 'Search developers to output' },
    repo: { type: 'array', default: [], desc: 'Search repo to output' },
    ch: { type: 'boolean', default: config.onlyChineseRepos, desc: 'Only show chinese repos' },
  }).argv;

  if (argv.help) {
    yargs.help();
    return;
  }

  console.log('Start to load data file.');

  const processor = new Processor();
  const data = await processor.processFile({
    filePath: argv.f,
    mode: argv.mode,
  });

  console.log('Load file done, start calculating.');
  // set operation weights
  const weightMap = new Map<OperationType, number>()
    .set(OperationType.ISSUE_COMMNT, argv.c)
    .set(OperationType.OPEN_ISSUE, argv.i)
    .set(OperationType.OPEN_PULL, argv.p)
    .set(OperationType.REVIEW_COMMENT, argv.r)
    .set(OperationType.MERGE_PULL, argv.m);
  // calculate the activity
  const arr = data.calc(weightMap);

  console.log('Calculate done, total count is', arr.length);
  // print out the results
  const table = [];
  if (argv.mode === 'repo') {
    // print out repo rank list
    if (argv.repo.length > 0) {
      console.log('Gonna print repo detail for', argv.repo);
      for (const repo of argv.repo) {
        const ri = arr.findIndex((record) => record.name === repo);
        if (ri < 0) { continue; }
        const r = arr[ri];
        const developers = Array.from(r.activityMap).sort((a, b) => {
          return b[1] - a[1];
        });
        if (developers.length > 0) {
          developers.slice(0, argv.top).forEach((v, index) => {
            const detail = r.detail.get(v[0]).detail;
            table.push({
              '#Global': ri + 1,
              '#': index + 1,
              repo,
              'developer': v[0],
              'activity': v[1],
              'issue comment': detail.get(OperationType.ISSUE_COMMNT) ?? 0,
              'open issue': detail.get(OperationType.OPEN_ISSUE) ?? 0,
              'open pull': detail.get(OperationType.OPEN_PULL) ?? 0,
              'review comment': detail.get(OperationType.REVIEW_COMMENT) ?? 0,
              'merge pull': detail.get(OperationType.MERGE_PULL) ?? 0,
            });
          });
        }
      }
    } else if (!argv.ch) {
      console.log('Gonna print global top', argv.n);
      table.push(...arr.slice(0, argv.n).map((r, i) => {
        return {
          '#': i + 1,
          'repo': r.name,
          'developers': r.activityMap.size,
          'activity': Math.round(r.activity),
        };
      }));
    } else {
      console.log('Gonna print chinese top', argv.n);
      const chineseRepos = loadChinese();
      let count = 0;
      for (let i = 0; i < arr.length; i++) {
        const r = arr[i];
        if (chineseRepos.findIndex((prefix) => r.name.startsWith(prefix)) >= 0) {
          count += 1;
          if (count > argv.n) {
            break;
          }
          table.push({
            '#': count,
            '#Global': i + 1,
            'repo': r.name,
            'developers': r.activityMap.size,
            'activity': Math.round(r.activity),
          });
        }
      }
    }
  } else if (argv.mode === 'dev') {
    if (argv.dev.length > 0) {
      // search developers
      console.log('Gonna print search developers');
      for (const login of argv.dev) {
        const di = arr.findIndex((record) => record.name === login);
        if (!di) { continue; }
        const developer = arr[di];
        const repos = Array.from(developer.activityMap).sort((a, b) => {
          return b[1] - a[1];
        });
        if (repos.length > 0) {
          repos.slice(0, argv.top).forEach((v, index) => {
            const detail = developer.detail.get(v[0]).detail;
            table.push({
              '#Global': di + 1,
              '#': index + 1,
              login,
              'repo': v[0],
              'activity': v[1],
              'issue comment': detail.get(OperationType.ISSUE_COMMNT) ?? 0,
              'open issue': detail.get(OperationType.OPEN_ISSUE) ?? 0,
              'open pull': detail.get(OperationType.OPEN_PULL) ?? 0,
              'review comment': detail.get(OperationType.REVIEW_COMMENT) ?? 0,
              'merge pull': detail.get(OperationType.MERGE_PULL) ?? 0,
            });
          });
        }
      }
    } else {
      // print top developers
      console.log('Gonna print global top', argv.n);
      table.push(...arr.slice(0, argv.n).map((r, i) => {
        return {
          '#': i + 1,
          'developer': r.name,
          'repos': r.activityMap.size,
          'activity': Math.round(r.activity),
        };
      }));
    }
  } else if (argv.mode === 'company') {
    console.log('Gonna print company top', argv.n);
    const companyMap =
      new Map<string, {
        repos: number, developers: number, activity: number,
        top500: number, top10000: number, rs: string[],
      }>();
    const companies = Array.from(loadChineseCompanies());
    arr.forEach((r, index) => {
      const c = companies.find((comp) => comp[1].find((prefix) => r.name.startsWith(prefix)));
      if (!c) { return; }
      const compName = c[0];
      if (!companyMap.has(compName)) {
        companyMap.set(compName, { repos: 0, developers: 0, activity: 0, top500: 0, top10000: 0, rs: [] });
      }
      const detail = companyMap.get(compName);
      detail.repos += 1;
      detail.developers += r.activityMap.size;
      detail.activity += r.activity;
      if (index < 500) {
        detail.rs.push(`${index + 1}:${r.name}`);
        detail.top500++;
      }
      if (index < 10000) {
        detail.top10000++;
      }
    });
    Array.from(companyMap).sort((a, b) => {
      return b[1].top10000 - a[1].top10000;
    }).forEach((c, index) => {
      const [company, detail] = c;
      table.push({
        '#': index + 1,
        company,
        'Repos': detail.repos,
        'Developers': detail.developers,
        'Activity': Math.round(detail.activity),
        'Top 500': detail.top500,
        'Top 10000': detail.top10000,
        'Top 500 repo array': detail.rs.join(','),
      });
    });
  }
  if (table.length > 0) {
    console.table(table);
  }

})();
