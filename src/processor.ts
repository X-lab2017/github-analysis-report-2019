'use strict';

import { once } from 'events';
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { createGunzip, gunzipSync, gzipSync } from 'zlib';
import { Mode } from './config';
import Data from './Data';
import { logger } from './utils';

interface IProcessorOptions {
  filePath: string;
  mode: Mode;
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

    const getCacheFilePath = (mode: Mode): string => {
      if (mode === 'dev') {
        return `.cache_${mode}.gz`;
      } else {
        return `.cache_repo.gz`;
      }
    };
    const cacheFilePath = getCacheFilePath(options.mode);
    if (existsSync(cacheFilePath)) {
      logger.info('Cache file found, path=', cacheFilePath);
      const o = JSON.parse(gunzipSync(readFileSync(cacheFilePath)).toString());
      data.parse(o);
      return data;
    }

    try {
      const rl = createInterface({
        crlfDelay: Infinity,
        input: createReadStream(options.filePath).pipe(createGunzip()),
      });

      let record: any;
      let process: (r: any) => void = (r: any) => {
        data.set(r.r, r.u, r.c, r.t);
      };
      if (options.mode === 'dev') {
        process = (r: any) => {
          data.set(r.u, r.r, r.c, r.t);
        };
      }
      rl.on('line', (line) => {
        if (line.length <= 0) { return; }
        try {
          record = JSON.parse(line);
          process(record);
        } catch {
          logger.info('Parse json fail, line=', line);
        }
      });

      await once(rl, 'close');
    } catch (e) {
      logger.info('Error during processing file, e =', e);
      return data;
    }

    const obj = data.toObj();
    writeFileSync(cacheFilePath, gzipSync(JSON.stringify(obj)));
    return data;
  }
}
