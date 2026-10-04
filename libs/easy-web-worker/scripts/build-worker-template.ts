/**
 * Generates src/getWorkerTemplate.ts from src/StaticEasyWebWorker.ts.
 *
 *   tsx scripts/build-worker-template.ts          # writes the file
 *   tsx scripts/build-worker-template.ts --check  # fails if the file is outdated, writes nothing
 */
import fs from 'node:fs';
import path from 'node:path';
import { getTemplateModuleStatus, templateFile } from './workerTemplate';

const isCheck = process.argv.includes('--check');
const fileName = path.relative(process.cwd(), templateFile);

getTemplateModuleStatus()
  .then(({ expected, isUpToDate }) => {
    if (isUpToDate) {
      console.log(`[template] ${fileName} is up to date.`);
      return;
    }

    if (isCheck) {
      console.error(`[template] ${fileName} is outdated. Run \`yarn build:template\`.`);
      process.exit(1);
    }

    fs.writeFileSync(templateFile, expected);

    console.log(`[template] ${fileName} updated.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
