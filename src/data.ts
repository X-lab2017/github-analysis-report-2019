'use strict';

export enum OperationType {
  ISSUE_COMMNT,
  OPEN_ISSUE,
  OPEN_PULL,
  REVIEW_COMMENT,
  MERGE_PULL,
}

class TypeData {
  public detail: Map<OperationType, number>;

  constructor() {
    this.detail = new Map<OperationType, number>();
  }

  public add(t: OperationType, c: number) {
    const count = c + (this.detail.has(t) ? this.detail.get(t) : 0);
    this.detail.set(t, count);
  }
}

export class DetailData {
  public name: string;
  public activity: number;
  public detail: Map<string, TypeData>;
  public activityMap: Map<string, number>;

  constructor(name: string) {
    this.name = name;
    this.activity = 0;
    this.activityMap = new Map<string, number>();
    this.detail = new Map<string, TypeData>();
  }

  public add(k: string, c: number, t: OperationType) {
    if (!this.detail.has(k)) {
      this.detail.set(k, new TypeData());
    }
    const data = this.detail.get(k);
    if (!data) { return; }
    data.add(t, c);
  }

  public calc(weightMap: Map<OperationType, number>) {
    this.activity = 0;
    this.detail.forEach((data, k) => {
      data.detail.forEach((c, type) => {
        const weight = weightMap.get(type);
        const credit = this.getCredit(k);
        this.activityMap.set(k, credit + c * weight);
      });
    });
    this.activityMap.forEach((c) => {
      this.activity += Math.sqrt(c);
    });
  }

  private getCredit(k: string): number {
    if (!this.activityMap.has(k)) {
      this.activityMap.set(k, 0);
      return 0;
    }
    return this.activityMap.get(k);
  }
}

export default class Data {
  private data: Map<string, DetailData>;

  constructor() {
    this.data = new Map<string, DetailData>();
  }

  public add(k1: string, k2: string, c: number, type: OperationType) {
    this.init(k1);
    const repo = this.data.get(k1);
    if (repo) {
      repo.add(k2, c, type);
    }
  }

  public calc(weightMap: Map<OperationType, number>): DetailData[] {
    this.data.forEach((r) => r.calc(weightMap));
    let arr = Array.from(this.data.values());
    arr = arr.sort((a, b) => {
      return b.activity - a.activity;
    });
    return arr;
  }

  private init(r: string) {
    if (!this.data.has(r)) {
      this.data.set(r, new DetailData(r));
    }
  }
}
