import * as prettyMilliseconds from "pretty-ms";

import { cli } from "cli-ux";
import { performance } from "perf_hooks";

export class Logging {
  private static _t: number;
  static get ms() {
    return performance.now() - Logging._t;
  }
  static reset() {
    Logging._t = performance.now();
  }
  static done(msg = "done") {
    return `${msg} in ${prettyMilliseconds(Logging.ms)}`;
  }
  static start(action: string) {
    Logging.reset();
    cli.action.start(action);
  }
  static stop(msg?: string) {
    cli.action.stop(Logging.done(msg));
  }
}
