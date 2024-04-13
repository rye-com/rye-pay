export type RyePayErrorCode =
  | 'BAD_AUTHORIZATION'
  | 'LOAD_FAILED'
  | 'INTERNAL'
  | 'INVALID_CONFIG'
  | 'NOT_READY';

interface RyePayErrorProps {
  cause?: unknown;
  code: RyePayErrorCode;
  message: string;
}

export class RyePayError extends Error {
  readonly cause?: unknown;
  readonly code: RyePayErrorCode;
  readonly message: string;

  constructor(props: RyePayErrorProps) {
    super(props.message);

    this.cause = props.cause;
    this.code = props.code;
    this.message = props.message;
    this.name = 'RyePayError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
    };
  }

  get [Symbol.toStringTag]() {
    return this.toString();
  }

  toString() {
    return `${this.name}: ${this.message} (${this.code})`;
  }

  static is(value: any): value is RyePayError {
    return Boolean(value !== null && typeof value === 'object' && value.isRyePayError);
  }
}

// Type sentinel is defined like this to prevent it surfacing in `for-in` / `Object.keys`
Object.defineProperty(RyePayError.prototype, 'isRyePayError', {
  enumerable: false,
  value: true,
});
