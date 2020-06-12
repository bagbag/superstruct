import { Struct, mask, StructType } from './struct'
import { ObjectSchema, InferObjectStruct } from './utils'

/**
 * Augment a `Struct` to add an additional coercion step to its input.
 */

export function coercion<T>(
  struct: Struct<T>,
  coercer: Struct<T>['coercer']
): Struct<T> {
  const fn = struct.coercer
  return new Struct({
    ...struct,
    coercer: (value) => {
      return fn(coercer(value))
    },
  })
}

/**
 * Augment a struct to coerce a default value for missing values.
 *
 * Note: You must use `coerce(value, Struct)` on the value before validating it
 * to have the value defaulted!
 */

export function defaulted<T, S>(
  S: Struct<T, S>,
  fallback: any,
  strict?: true
): Struct<T, S> {
  return coercion(S, (x) => {
    const f = typeof fallback === 'function' ? fallback() : fallback

    if (x === undefined) {
      return f
    }

    if (strict !== true && isPlainObject(x) && isPlainObject(f)) {
      const ret = { ...x }
      let changed = false

      for (const key in f) {
        if (ret[key] === undefined) {
          ret[key] = f[key]
          changed = true
        }
      }

      if (changed) {
        return ret
      }
    }

    return x
  })
}

/**
 * Coerce a value to mask its properties to only that defined in the struct.
 */

export function masked<S extends ObjectSchema>(
  struct: InferObjectStruct<S>
): InferObjectStruct<S> {
  return coercion(struct, (x) => {
    return typeof x !== 'object' || x == null ? x : mask(x, struct)
  })
}

/**
 * Check if a value is a plain object.
 */

function isPlainObject(value: unknown): value is { [key: string]: any } {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}
