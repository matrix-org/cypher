/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Schema } from 'yup';

/*
 * Returns a lambda which validates the argument against the yup schema
 * and casts it to the correct type.
 *
 * Usefull for getting type checking from external data
 */
export function yupCast<T>(yupSchema: Schema<T>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (v: any) =>
        yupSchema.isValid(v).then(isTrue(() => yupSchema.cast(v)));
}


/*
 * Returns a lambda which casts the json to the correct type. This is unsafe.
 *
 * Usefull for getting type checking from external data
 */
export function unsafeYupCast<T>(yupSchema: Schema<T>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (v: any) => yupSchema.cast(v);
}


/*
 * Conditional promises
 */

/*
 * If the condition is false reject with rejectReason
 * If it's true resolve with the result = resultThunk()
 */
export function ensure<T>(condition: boolean, resultThunk: () => T | PromiseLike<T>, rejectReason?: string) {
    return condition
        ? Promise.resolve(resultThunk())
        : Promise.reject(new Error(rejectReason));
}

/*
 * Same as ensure but acts like a lambda
 * ```
 * Promise.resolve(true)
 *   .then(isTrue(() => "yay"))
 *   .then(console.log) // writes "yay" to console
 * ```
 */
export function isTrue<T>(resultThunk: () => T | PromiseLike<T>, rejectReason?: string) {
    return (condition: boolean) => ensure<T>(condition, resultThunk, rejectReason)
}

/*
 * Loggin utilities
 */

/*
 * Logs a then using "success: {label: successArg}"
 */
export function logThen<T>(label: string): (v: T) => T | PromiseLike<T> {
    return (v: T) => {
        console.log('success:', {[`${label}`]: v}); return v
    }
}

/*
 * Logs a catch using "fail: {label: failArg}"
 */
export function logCatch<T>(label: string): (v: T) => T | PromiseLike<T> {
    return (v: T) => {
        console.log('fail:', {[`${label}`]: v});
        return Promise.reject(v)
    }
}

/*
 * inserts loggers for both callbacks of a then
 */
export function logThens<T1, T2 = T1>(label: string) {
    return [logThen<T1>(label), logCatch<T2>(label)]
}

/*
 * Inverts a promise.
 */
export function invert<T>(promise: Promise<T>) {
    return new Promise<T>(
        (resolve, reject) => Promise.resolve(promise).then(reject, resolve),
    );
}

/*
 * Implements promise.any
 */
export function any<T>(iterable: Promise<T>[]) {
    return invert(Promise.all([...iterable].map(invert)));
}
