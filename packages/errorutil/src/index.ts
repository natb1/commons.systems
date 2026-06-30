/**
 * Error-reporting convention: prefer `logError` over bare `reportError` in any
 * package that depends on errorutil, and in all apps. See `log.ts` for the
 * full convention, including the sanctioned exception for zero-dep packages.
 */
export { classifyError, type ErrorKind } from "./classify.ts";
export { deferProgrammerError } from "./defer.ts";
export { logError, registerErrorSink, type ErrorContext, type EnrichedErrorContext, type ErrorSink } from "./log.ts";
export { installGlobalErrorHandlers } from "./global-handler.ts";
