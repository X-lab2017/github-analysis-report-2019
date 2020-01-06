'use strict';

export enum OperationType {
  ISSUE_COMMNT,
  OPEN_ISSUE,
  OPEN_PULL,
  REVIEW_COMMENT,
  MERGE_PULL,
}

class TypeData {
  public totalCount: number;
  public detail: Map<string, number>;

  constructor() {
    this.totalCount = 0;
    this.detail = new Map<string, number>();
  }

  public add(u: string, c: number) {
    const count = c + (this.detail.has(u) ? this.detail.get(u) : 0);
    this.detail.set(u, count);
    this.totalCount += count;
  }
}

export class Repo {
  public name: string;
  public activity: number;
  public typeData: Map<OperationType, TypeData>;
  public userActivity: Map<string, number>;

  constructor(name: string) {
    this.name = name;
    this.activity = 0;
    this.userActivity = new Map<string, number>();
    this.typeData = new Map<OperationType, TypeData>();
  }

  public add(u: string, c: number, type: OperationType) {
    if (!this.typeData.has(type)) {
      this.typeData.set(type, new TypeData());
    }
    const data = this.typeData.get(type);
    if (!data) { return; }
    data.add(u, c);
  }

  public calc(weightMap: Map<OperationType, number>) {
    this.activity = 0;
    this.typeData.forEach((data, type) => {
      const weight = weightMap.get(type);
      data.detail.forEach((c, u) => {
        const credit = this.getCredit(u);
        this.userActivity.set(u, credit + c * weight);
      });
    });
    this.userActivity.forEach((c) => {
      this.activity += Math.sqrt(c);
    });
  }

  public print(index: number) {
    console.log(`${index}:${this.name}, developers: ${this.userActivity.size}, activity: ${Math.round(this.activity)}`);
  }

  private getCredit(user: string): number {
    if (!this.userActivity.has(user)) {
      this.userActivity.set(user, 0);
      return 0;
    }
    return this.userActivity.get(user);
  }
}

export default class Data {
  private data: Map<string, Repo>;

  constructor() {
    this.data = new Map<string, Repo>();
  }

  public add(r: string, u: string, c: number, type: OperationType) {
    this.init(r);
    const repo = this.data.get(r);
    if (repo) {
      repo.add(u, c, type);
    }
  }

  public calc(weightMap: Map<OperationType, number>) {
    this.data.forEach((r) => r.calc(weightMap));
  }

  public async print(n: number = 0) {
    if (n <= 0) {
      n = this.data.size;
    }
    console.log(`Total repos: ${this.data.size}`);
    let arr = Array.from(this.data.values());
    arr = arr.sort((a, b) => {
      return b.activity - a.activity;
    }).slice(0, n);
    arr.forEach((repo, index) => repo.print(index));
  }

  private init(r: string) {
    if (!this.data.has(r)) {
      this.data.set(r, new Repo(r));
    }
  }
}
