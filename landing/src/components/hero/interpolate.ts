export type EasingFn = (t: number) => number

export const easePowerOut: EasingFn = (t) => 1 - Math.pow(1 - t, 3)
export const easeSharpSettle: EasingFn = (t) => {
  const c = 1.6
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, c) / 2
}

export type Tween = { cancel: () => void; done: Promise<void> }

export function tween(
  durationMs: number,
  easing: EasingFn,
  onUpdate: (t: number) => void,
): Tween {
  let raf = 0
  let cancelled = false
  let resolve: () => void = () => {}
  const done = new Promise<void>((r) => (resolve = r))
  const start = performance.now()

  const step = (now: number) => {
    if (cancelled) return
    const raw = durationMs === 0 ? 1 : Math.min(1, (now - start) / durationMs)
    onUpdate(easing(raw))
    if (raw < 1) raf = requestAnimationFrame(step)
    else resolve()
  }
  raf = requestAnimationFrame(step)

  return {
    cancel() {
      cancelled = true
      cancelAnimationFrame(raf)
      resolve()
    },
    done,
  }
}

export function tweenValue(
  from: number,
  to: number,
  durationMs: number,
  easing: EasingFn,
  onUpdate: (v: number) => void,
): Tween {
  return tween(durationMs, easing, (t) => onUpdate(from + (to - from) * t))
}
