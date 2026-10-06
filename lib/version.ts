import { version } from "../package.json";

export const APP_VERSION = version;
export const SHORT_VERSION = version.split(".").slice(0, 2).join(".");
