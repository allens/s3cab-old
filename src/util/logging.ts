import { cli } from "cli-ux";
import { performance } from "perf_hooks";

export class T {
  private static _t: number;
  static get ms() {
    return performance.now() - T._t;
  }
  static get seconds() {
    return Math.round(T.ms / 1000);
  }
  static reset() {
    T._t = performance.now();
  }
  static done(msg = "done") {
    return T.seconds ? `${msg} [${T.seconds} seconds]` : msg;
  }
  static start(action: string) {
    T.reset();
    cli.action.start(action);
  }
  static stop(msg?: string) {
    cli.action.stop(T.done(msg));
  }
}
