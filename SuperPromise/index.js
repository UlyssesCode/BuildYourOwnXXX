//定义三种可能状态
const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

class SuperPromise {
  constructor(executor) {
    this.state = PENDING;
    this.queue = [];

    doResolve(this, executor);
  }
  then(onFulfilled, onRejected) {
    const promise = new SuperPromise(() => {});
    handle(this, { promise, onFulfilled, onRejected });
    return promise;
  }
}

function handle(promise, handler) {
  while (promise.state != REJECTED && promise.value instanceof SuperPromise) {
    promise = promise.value;
  }
  if (promise.state === PENDING) {
    promise.queue.push(handler);
  } else {
    handleResolved(promise, handler);
  }
}

function handleResolved(promise, handler) {
  const cb =
    promise.state === FULFILLED ? handler.onFulfilled : handler.onRejected;
  if (typeof cb !== "function") {
    if (promise.state === FULFILLED) {
      fulfill(handler.promise, promise.value);
    } else {
      reject(handler.promise, promise.value);
    }
    return;
  }
  try {
    const value = cb(promise.value);
    fulfill(handler.promise, value);
  } catch (err) {
    reject(handler.promise, err);
  }
}

function fulfill(promise, value) {
  if (value === promise) {
    return reject(promise, new TypeError());
  }
  if (value && (typeof value === "object" || typeof value === "function")) {
    let then;
    try {
      then = value.then;
    } catch (err) {
      return reject(promise, err);
    }

    // promise
    if (then === promise.then && promise instanceof SuperPromise) {
      promise.state = FULFILLED;
      promise.value = value;
      return finale(promise);
    }

    // thenable
    if (typeof then === "function") {
      return doResolve(promise, then.bind(value));
    }
  }
  promise.state = FULFILLED;
  promise.value = value;
  finale(promise);
}

function reject(promise, reason) {
  promise.state = REJECTED;
  promise.value = reason;
  finale(promise);
}

function finale(promise) {
  const length = promise.queue.length;
  for (let i = 0; i < length; i += 1) {
    handle(promise, promise.queue[i]);
  }
}

function doResolve(promise, executor) {
  let called = false;

  try {
    executor(wrapFulfill, wrapReject);
  } catch (err) {
    wrapReject(err);
  }

  function wrapFulfill(value) {
    if (called) {
      return;
    }
    called = true;
    fulfill(promise, value);
  }

  function wrapReject(reason) {
    if (called) {
      return;
    }
    called = true;
    reject(promise, reason);
  }
  try {
    executor(wrapFulfill, wrapReject);
  } catch (err) {
    wrapReject(err);
  }
}

//虚假的后台api
function fakeApiBackend() {
  const user = {
    username: "UlyssesCode",
    favoriteNumber: 3,
    profile: "https://github.com/UlyssesCode",
  };

  // 一半的概率返回错误信息
  if (Math.random() > 0.5) {
    return {
      data: user,
      statusCode: 200,
    };
  } else {
    const error = {
      statusCode: 404,
      message: "无法找到用户",
      error: "Not Found",
    };

    return error;
  }
}

// 一个模拟的AJAX调用，延迟为一秒来模拟网络延迟
const makeApiCall = () => {
  return new SuperPromise((resolve, reject) => {
    setTimeout(() => {
      const apiResponse = fakeApiBackend();

      if (apiResponse.statusCode >= 400) {
        reject(apiResponse);
      } else {
        resolve(apiResponse.data);
      }
    }, 2000);
  });
};

console.log("程序开始执行");

makeApiCall()
  .then((user) => {
    console.log("In the first .then()");
    return user;
  })
  .then((user) => {
    console.log(
      `User ${user.username}'s favorite number is ${user.favoriteNumber}`
    );

    return user;
  })
  .then((user) => {
    console.log("The previous .then() told you the favoriteNumber");

    return user.profile;
  })
  .then((profile) => {
    console.log(`The profile URL is ${profile}`);
  })
  .then(() => {
    console.log("This is the last then()");
  });
