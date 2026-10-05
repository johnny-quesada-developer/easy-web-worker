/**
 * Generates the templates used to create workers from functions:
 *   src/getWorkerTemplate.ts        from src/StaticEasyWebWorker.ts
 *   src/getDefineWorkerTemplate.ts  from src/buildWorker.ts
 *
 *   tsx scripts/build-worker-template.ts          # writes the files
 *   tsx scripts/build-worker-template.ts --check  # fails if a file is outdated, writes nothing
 */
import fs from 'node:fs';
import path from 'node:path';
import { getTemplatesStatus } from './workerTemplate';

const isCheck = process.argv.includes('--check');

getTemplatesStatus()
  .then((statuses) => {
    let isOutdated = false;

    statuses.forEach(({ file, expected, isUpToDate }) => {
      const fileName = path.relative(process.cwd(), file);

      if (isUpToDate) {
        console.log(`[template] ${fileName} is up to date.`);
        return;
      }

      if (isCheck) {
        isOutdated = true;

        console.error(`[template] ${fileName} is outdated. Run \`yarn build:template\`.`);
        return;
      }

      fs.writeFileSync(file, expected);

      console.log(`[template] ${fileName} updated.`);
    });

    if (isOutdated) process.exit(1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
