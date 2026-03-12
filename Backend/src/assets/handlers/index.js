/**
 * Asset Handlers Registry
 * Description: itemType -> handler mapping. Yahan new asset types ko plug karo.
 */
import cpu from "./cpu.handler.js";
import monitor from "./monitor.handler.js";

export const handlers = {
  cpu,
  monitor,
  __generic: cpu,
};
