import { readFileSync } from 'fs';
import { EOL } from 'os';

// load all chinese repos prefix array
export function loadChinese(): string[] {
  const chineseFilePath = './chinese';
  const chineseCompanyFilePath = './chinese_company';

  const chinese = readFileSync(chineseFilePath).toString();
  const chinseCompany = readFileSync(chineseCompanyFilePath).toString();

  const ret: string[] = [];

  const add = (l: string): void => {
    if (l.length <= 0) {
      return;
    }
    if (!l.includes('/')) {
      l += '/';
    }
    ret.push(l);
  };

  chinese.split(EOL).forEach(add);

  let firstLine = true;
  chinseCompany.split(EOL).forEach((l) => {
    if (firstLine) {
      firstLine = false;
      return;
    }
    if (l.length === 0 && !firstLine) {
      firstLine = true;
      return;
    }
    add(l);
  });

  return ret;
}

// load chinese companies
export function loadChineseCompanies(): Map<string, string[]> {
  const chineseCompanyFilePath = './chinese_company';
  const chinseCompany = readFileSync(chineseCompanyFilePath).toString();
  const ret = new Map<string, string[]>();

  let arr: string[] = [];
  const add = (l: string): void => {
    if (l.length <= 0) {
      return;
    }
    if (!l.includes('/')) {
      l += '/';
    }
    arr.push(l);
  };

  let firstLine = true;
  let company = '';
  chinseCompany.split(EOL).forEach((l) => {
    if (firstLine) {
      company = l;
      firstLine = false;
      return;
    }
    if (l.length === 0 && !firstLine) {
      firstLine = true;
      ret.set(company, arr);
      arr = [];
      return;
    }
    add(l);
  });

  return ret;
}

export const logger = {
  info(...args: any[]) {
    console.log(new Date(), ...args);
  },
  error(...args: any[]) {
    console.error(new Date(), ...args);
  },
};
