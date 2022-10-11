"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyWebWorkerFactory = void 0;
const EasyWebWorkerFixtures_1 = require("./EasyWebWorkerFixtures");
class EasyWebWorkerFactory {
    getImportScriptsTemplate(scripts = []) {
        if (!scripts.length)
            return "";
        return `self.importScripts(["${scripts.join('","')}"]);`;
    }
    blob(source, imports = []) {
        const content = `${this.getImportScriptsTemplate(imports)}
    ${source}`;
        return (window.URL || window.webkitURL).createObjectURL(new Blob([content], {
            type: "application/javascript",
        }));
    }
    blobWorker(source, imports = []) {
        const template = EasyWebWorkerFixtures_1.WorkerTemplate();
        const contentCollection = Array.isArray(source) ? source : [source];
        return (window.URL || window.webkitURL).createObjectURL(new Blob([
            `${this.getImportScriptsTemplate(imports)}
      ${template}
      ${contentCollection
                .map((content, index) => `// content #${index}\n(${content.toString()})(easyWorker, self);`)
                .join("\n\n")}`,
        ], { type: "application/javascript" }));
    }
}
exports.EasyWebWorkerFactory = EasyWebWorkerFactory;
exports.default = new EasyWebWorkerFactory();
