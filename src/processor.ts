'use strict';

import { once } from 'events';
import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
import Data from './Data';

interface IProcessorOptions {
  filePath: string;
  mode: 'repo' | 'dev' | 'company';
}

export interface IRecord {
  r: string;
  u: string;
  t: number;
  c: number;
}

export class Processor {
  public async processFile(options: IProcessorOptions): Promise<Data> {
    const data = new Data();
    if (!existsSync(options.filePath)) {
      console.error(`File not exists, path = `, options.filePath);
      return data;
    }

    try {
      const rl = createInterface({
        crlfDelay: Infinity,
        input: createReadStream(options.filePath).pipe(createGunzip()),
      });

      let record: any;
      let process: (r: any) => void = (r: any) => {
        data.add(r.r, r.u, r.c, r.t);
      };
      if (options.mode === 'dev') {
        process = (r: any) => {
          data.add(r.u, r.r, r.c, r.t);
        };
      }
      rl.on('line', (line) => {
        if (line.length <= 0) { return; }
        try {
          record = JSON.parse(line);
          process(record);
          // tslint:disable-next-line: no-empty
        } catch { }
      });

      await once(rl, 'close');
    } catch (e) {
      console.error('Error during processing file, e = ', e);
      return data;
    }

    return data;
  }
}
