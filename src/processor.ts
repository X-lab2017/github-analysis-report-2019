'use strict';

import { once } from 'events';
import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
import Data from './Data';

export class Processor {
  public async processFile(filePath: string): Promise<Data> {
    const data = new Data();
    if (!existsSync(filePath)) {
      console.error(`File not exists, path = `, filePath);
      return data;
    }

    try {
      const rl = createInterface({
        crlfDelay: Infinity,
        input: createReadStream(filePath).pipe(createGunzip()),
      });

      let record: any;
      rl.on('line', (line) => {
        if (line.length <= 0) { return; }
        record = JSON.parse(line);
        data.add(record.r, record.u, record.c, record.t);
      });

      await once(rl, 'close');
    } catch (e) {
      console.error('Error during processing file, e = ', e);
      return data;
    }

    return data;
  }
}
