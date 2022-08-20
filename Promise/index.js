class OwnPromise {
  //构造函数，传入回调函数
  constructor(executionFunction) {
    this.promiseChain = [];
    this.handleError = () => {};

    this.onResolve = this.onResolve.bind(this);
    this.onReject = this.onReject.bind(this);

    executionFunction(this.onResolve, this.onReject);
  }

  //then方法，处理回调成功的情况
  then(handleSuccess) {
    //向promise链中添加回调函数
    this.promiseChain.push(handleSuccess);

    return this;
  }

  //catch方法，处理回调失败的情况
  catch(handleError) {
    //直接处理错误
    this.handleError = handleError;

    return this;
  }

  onResolve(value) {
    let storedValue = value;

    try {
      this.promiseChain.forEach((nextFunction) => {
        storedValue = nextFunction(storedValue);
      });
    } catch (error) {
      //将promiseChain置为空
      this.promiseChain = [];

      this.onReject(error);
    }
  }

  onReject(error) {
    this.handleError(error);
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
  return new OwnPromise((resolve, reject) => {
    setTimeout(() => {
      const apiResponse = fakeApiBackend();

      if (apiResponse.statusCode >= 400) {
        reject(apiResponse);
      } else {
        resolve(apiResponse.data);
      }
    }, 1000);
  });
};

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
  })
  .catch((error) => {
    console.log(error.message);
  });
