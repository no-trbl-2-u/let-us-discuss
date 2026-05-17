// Pure token tracker. No I/O. The orchestrator (phase 7b) calls add() after
// each turn, willOverflow() before launching the next one, and wraps the
// session gracefully when the answer is yes.

export type BudgetSnapshot = {
  used: number
  cap: number
  remaining: number
}

export class BudgetTracker {
  private constructor(
    private _used: number,
    private readonly _cap: number,
  ) {}

  static create(cap: number): BudgetTracker {
    if (!Number.isFinite(cap) || cap <= 0) {
      throw new Error(
        `BudgetTracker: cap must be a positive finite number (got ${cap})`,
      )
    }
    return new BudgetTracker(0, cap)
  }

  add(tokens: number): void {
    if (!Number.isFinite(tokens) || tokens < 0) {
      throw new Error(
        `BudgetTracker.add: tokens must be a non-negative finite number (got ${tokens})`,
      )
    }
    this._used += tokens
  }

  willOverflow(estimated: number): boolean {
    if (!Number.isFinite(estimated) || estimated < 0) {
      throw new Error(
        `BudgetTracker.willOverflow: estimated must be a non-negative finite number (got ${estimated})`,
      )
    }
    return this._used + estimated > this._cap
  }

  snapshot(): BudgetSnapshot {
    return {
      used: this._used,
      cap: this._cap,
      remaining: Math.max(0, this._cap - this._used),
    }
  }
}
