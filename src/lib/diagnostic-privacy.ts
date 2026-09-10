import type { ErrorEvent, EventHint, StackFrame } from '@sentry/nextjs';

const ERROR_TYPES = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError', 'AggregateError']);

/** Only generated code files; never a document URL, tenant route or uploaded filename. */
export function diagnosticCodeFile(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const path = value.split(/[?#]/, 1)[0].replaceAll('\\', '/');
  const match = path.match(/(?:\/_next\/static\/chunks\/|\/\.next\/server\/chunks\/)(?:[^?#]*\/)?([a-zA-Z0-9_.-]*[a-f0-9]{8,64}(?:[._-][a-zA-Z0-9_-]+)?\.js)$/);
  if (!match) return undefined;
  return (path.includes('/_next/static/') ? 'https://tevaxia.lu/_next/static/chunks/' : 'app:///.next/server/chunks/') + match[1];
}

function safeFrame(frame: StackFrame): StackFrame {
  return {
    filename: diagnosticCodeFile(frame.filename ?? frame.abs_path),
    lineno: Number.isSafeInteger(frame.lineno) && frame.lineno! > 0 ? frame.lineno : undefined,
    colno: Number.isSafeInteger(frame.colno) && frame.colno! > 0 ? frame.colno : undefined,
    in_app: frame.in_app === true,
  };
}

/** Last error-event filter shared by browser, Node and Edge. */
export function sanitizeDiagnosticEvent(event: ErrorEvent, hint: EventHint): ErrorEvent {
  hint.attachments = [];
  return {
    type: undefined,
    event_id: /^[a-f0-9]{32}$/.test(event.event_id ?? '') ? event.event_id : undefined,
    timestamp: typeof event.timestamp === 'number' && Number.isFinite(event.timestamp) ? event.timestamp : undefined,
    platform: 'javascript',
    level: event.level === 'fatal' ? 'fatal' : 'error',
    environment: ['production', 'development', 'test'].includes(event.environment ?? '') ? event.environment : undefined,
    release: /^(?:[a-f0-9]{7,64}|\d+\.\d+\.\d+)$/.test(event.release ?? '') ? event.release : undefined,
    message: 'Application error (private details omitted)',
    exception: event.exception ? { values: event.exception.values?.slice(-5).map(value => ({
      type: ERROR_TYPES.has(value.type ?? '') ? value.type : 'Error',
      value: 'Private details omitted',
      stacktrace: value.stacktrace ? { frames: value.stacktrace.frames?.slice(-50).map(safeFrame) } : undefined,
      mechanism: { type: 'generic', handled: value.mechanism?.handled !== false },
    })) } : undefined,
  };
}

export const DIAGNOSTIC_PRIVACY_OPTIONS = {
  beforeSend: sanitizeDiagnosticEvent,
  beforeSendTransaction: () => null,
  beforeSendLog: () => null,
  enableLogs: false,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,
  maxBreadcrumbs: 0,
  dataCollection: {
    userInfo: false, cookies: false, httpHeaders: { request: false, response: false },
    httpBodies: [], urlQueryParams: false, graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false }, databaseQueryData: false,
    stackFrameVariables: false, frameContextLines: 0,
  },
};
