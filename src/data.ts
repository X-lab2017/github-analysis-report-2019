'use strict';

import { Sort } from './config';

export enum OperationType {
  ISSUE_COMMNT,
  OPEN_ISSUE,
  OPEN_PULL,
  REVIEW_COMMENT,
  MERGE_PULL,
}

export interface IRecordStructure {
  [key: string]: Array<{
    u: string;
    c: number[];
  }>;
}

class TypeData {
  public name: string;
  public opCount: Map<OperationType, number>;
  public activity: number;

  constructor(name: string) {
    this.name = name;
    this.opCount = new Map<OperationType, number>();
  }

  public set(t: OperationType, c: number) {
    this.opCount.set(t, c);
  }

  public calc(weightMap: Map<OperationType, number>) {
    this.activity = 0;
    this.opCount.forEach((c, type) => {
      const weight = weightMap.get(type);
      this.activity += c * weight;
    });
  }
}

export class DetailData {
  public name: string;
  public activity: number;
  public sortedData: TypeData[];
  public opCount: Map<OperationType, number>;
  public data: Map<string, TypeData>;

  constructor(name: string) {
    this.name = name;
    this.activity = 0;
    this.data = new Map<string, TypeData>();
    this.sortedData = null;
    this.opCount = new Map<OperationType, number>();
  }

  public set(k: string, c: number, t: OperationType) {
    if (!this.data.has(k)) {
      this.data.set(k, new TypeData(k));
    }
    this.data.get(k).set(t, c);
  }

  public calc(weightMap: Map<OperationType, number>) {
    this.activity = 0;
    this.data.forEach((d) => {
      d.calc(weightMap);
      this.activity += Math.sqrt(d.activity);
      for (let t = OperationType.ISSUE_COMMNT; t <= OperationType.MERGE_PULL; t++) {
        this.opCount.set(t, (this.opCount.get(t) ?? 0) + (d.opCount.get(t) ?? 0));
      }
    });
    this.sortedData = Array.from(this.data.values()).sort((a, b) => b.activity - a.activity);
    this.activity = Math.round(this.activity);
  }
}

export default class Data {
  public sortedData: DetailData[];
  public opCount: Map<OperationType, number>;
  private data: Map<string, DetailData>;

  constructor() {
    this.data = new Map<string, DetailData>();
    this.sortedData = null;
    this.opCount = new Map<OperationType, number>();
  }

  public set(k1: string, k2: string, c: number, type: OperationType) {
    if (!this.data.has(k1)) {
      this.data.set(k1, new DetailData(k1));
    }
    this.data.get(k1).set(k2, c, type);
  }

  public calc(weightMap: Map<OperationType, number>, sort: Sort): void {
    this.data.forEach((d) => {
      d.calc(weightMap);
      for (let t = OperationType.ISSUE_COMMNT; t <= OperationType.MERGE_PULL; t++) {
        this.opCount.set(t, (this.opCount.get(t) ?? 0) + (d.opCount.get(t) ?? 0));
      }
    });
    if (sort === 'act') {
      this.sortedData = Array.from(this.data.values()).sort((a, b) => b.activity - a.activity);
    } else if (sort === 'cnt') {
      this.sortedData = Array.from(this.data.values()).sort((a, b) => b.data.size - a.data.size);
    }
  }

  public parse(obj: IRecordStructure): void {
    this.data = new Map<string, DetailData>();
    const keys = Object.keys(obj);
    keys.forEach((k) => {
      const r = obj[k];
      const detail = new DetailData(k);
      r.forEach((v) => {
        const { u, c: counts } = v;
        counts.forEach((c, t) => {
          detail.set(u, c, t);
        });
      });
      this.data.set(k, detail);
    });
  }

  public toObj(): IRecordStructure {
    const obj: IRecordStructure = {};
    this.data.forEach((v, k) => {
      obj[k] = Array.from(v.data).map((detail) => {
        const m = detail[1].opCount;
        return {
          u: detail[0],
          c: [m.get(OperationType.ISSUE_COMMNT) ?? 0, m.get(OperationType.OPEN_ISSUE) ?? 0,
          m.get(OperationType.OPEN_PULL) ?? 0, m.get(OperationType.REVIEW_COMMENT) ?? 0,
          m.get(OperationType.MERGE_PULL) ?? 0],
        };
      });
    });
    return obj;
  }
}
