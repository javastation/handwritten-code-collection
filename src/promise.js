const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
export class MyPromise {
  value;
  reason;
  status = PENDING;
  fulFilledCallbacks = [];
  rejectedCallbacks = [];
  constructor(fn) {
    try {
      fn(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }
  static resolve(arg) {
    if (arg instanceof MyPromise) return arg;
    return new MyPromise((resolve) => {
      resolve(arg);
    });
  }
  static reject(e) {
    return new MyPromise((_, reject) => {
      reject(e);
    });
  }
  resolve(v) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = v;
      while (this.fulFilledCallbacks.length) {
        this.fulFilledCallbacks.shift()(this.value);
      }
    }
  }
  reject(r) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = r;
      while (this.rejectedCallbacks.length) {
        this.rejectedCallbacks.shift()(this.reason);
      }
    }
  }
  then(fulfilledCallback, rejectCallback) {
    fulfilledCallback =
      typeof fulfilledCallback === 'function' ? fulfilledCallback : (v) => v;
    rejectCallback =
      typeof rejectCallback === 'function' ? rejectCallback : (v) => v;
    // 创建一个新的 promise
    const promise = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () =>
        queueMicrotask(() => {
          try {
            const result = fulfilledCallback(this.value);
            resolvePromise(promise, result, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      const rejectedMicrotask = () =>
        queueMicrotask(() => {
          try {
            const result = rejectCallback(this.reason);
            resolvePromise(promise, result, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      if (this.status === PENDING) {
        this.fulFilledCallbacks.push(fulfilledMicrotask);
        this.rejectedCallbacks.push(rejectedMicrotask);
      }
      if (this.status === FULFILLED) {
        fulfilledMicrotask();
      }
      if (this.status === REJECTED) {
        rejectedMicrotask();
      }
    });
    return promise;
  }
}

const resolvePromise = (promise, result, resolve, reject) => {
  if (promise === result) return reject(new TypeError('type error'));
  if (result instanceof MyPromise) {
    // 如果 then中 fulfill 返回的是一个实例，调用实例 then,根据实例内部状态判断promise 状态
    return result.then(resolve, reject);
  }
  return resolve(result);
};
