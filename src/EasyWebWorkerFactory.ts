import { WorkerTemplate } from './EasyWebWorkerFixtures';
import { EasyWebWorkerBody } from './EasyWebWorkerTypes';

class EasyWebWorkerFactory {
  private getImportScriptsTemplate(scripts: string[] = []) {
    if (!scripts.length) return '';

    return `self.importScripts(["${scripts.join('","')}"]);`;
  }

  public blob(source: string, imports: string[] = []) {
    const content = `${this.getImportScriptsTemplate(imports)}
    ${source}`;

    return (window.URL || window.webkitURL).createObjectURL(
      new Blob([content], {
        type: 'application/javascript',
      })
    );
  }

  public blobWorker<IPayload = null, IResult = void>(
    source:
      | EasyWebWorkerBody<IPayload, IResult>
      | EasyWebWorkerBody<IPayload, IResult>[],
    imports: string[] = []
  ) {
    const template = WorkerTemplate();

    const contentCollection: EasyWebWorkerBody<IPayload, IResult>[] =
      Array.isArray(source) ? source : [source];

    return (window.URL || window.webkitURL).createObjectURL(
      new Blob(
        [
          `${this.getImportScriptsTemplate(imports)}
      
          ${template}
      
          ${contentCollection
            .map(
              (content, index) =>
                `// content #${index}\n(${content.toString()})(easyWorker, self);`
            )
            .join('\n\n')}`,
        ],
        { type: 'application/javascript' }
      )
    );
  }
}

export const easyWebWorkerFactory = new EasyWebWorkerFactory();
