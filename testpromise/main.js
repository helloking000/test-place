// （1）callback不会立即执行
var oneOneSecondLater = function (callback) {
    setTimeout(() => {
        callback(1);
    }, 1000);
}

// (2) 增加 抛出错误
var oneOneSecondLater = function (callback, errback) {
    setTimeout(() => {
        if (Math.random() < .5) {
            callback(1);
        } else {
            errback(new Error('Can not provide one.'))
        }
    }, 1000);
}

// oneOneSecondLater(val => console.log(val), val => console.log(val));

// 以上的方法，没有有效 处理 错误的传递
// (3) then方法先添加 函数，然后在 settimeout 里面执行，这样的逻辑 太绕
var maybeOneOneSecondLater = function() {
    var callback;
    setTimeout(() => {
        callback('sucess')
    }, 1000);

    return {
        then: function(cb) {
            callback = cb;
        }
    }
}

// maybeOneOneSecondLater().then(val => console.log(val));

// (4) 继续修改 可接受任意数量的 callback, timeout（resolution event） 之前或之后 都能注册, 其实之后 就是直接调用了
var maybeOneOneSecondLater = function () {
    var callbacks = [], value = 'ss';
    setTimeout(() => {
        callbacks.forEach(cb => {
            cb(value);
        });
        callbacks = undefined; // 这就是置位！不可逆的哦
    }, 1000);

    return {
        then: function (cb) {
            if (callbacks) {
                callbacks.push(cb)
            } else {
                callbacks(value);
            }
        }
    }
}

// var promiseInstance = maybeOneOneSecondLater();
// promiseInstance.then(val => console.log(val))
// promiseInstance.then(val => console.log(val + ' helloking'))

// （5）这样是否完成了 大部分工作？ -- 继续简化
var defer = function () {
    var callbacks = [], value;
    return {
        resolve: function (val) {
            value = val;
            callbacks.forEach(cb => {
                cb(value);
            });
            callbacks = undefined; // 这就是置位！不可逆的哦           
        },
        then: function (cb) {
            if (callbacks) {
                callbacks.push(cb)
            } else {
                callbacks(value);
            }
        }
    }
}

var maybeOneOneSecondLater = function () {
    var result = defer();
    setTimeout(() => {
        result.resolve('defer');
    }, 1000);

    return result;
}

// var promiseInstance = maybeOneOneSecondLater();
// promiseInstance.then(val => console.log(val))
// promiseInstance.then(val => console.log(val + ' helloking'))

// (6) 仍然有问题，-- 错误处理！
var defer = function () {
    var callbacks = [], value;
    return {
        resolve: function (val) {
            if (callbacks) {
                value = val;
                callbacks.forEach(cb => {
                    cb(value);
                });
                callbacks = undefined; // 这就是置位！不可逆的哦    
            } else {
                throw new Error("A promise can only be resolved once.");
            }
       
        },
        then: function (cb) {
            if (callbacks) {
                callbacks.push(cb)
            } else {
                callbacks(value);
            }
        }
    }
}

// (7) 功能分离
// var Promise = function () {
// };

// var defer = function () {
//     var callbacks = [], value;
//     var promise = new Promise();
//     promise.then = function (cb) {
//         if (callbacks) {
//             callbacks.push(cb)
//         } else {
//             callbacks(value);
//         }
//     }

//     return {
//         resolve: function (val) {
//             if (callbacks) {
//                 value = val;
//                 callbacks.forEach(cb => {
//                     cb(value);
//                 });
//                 callbacks = undefined; // 这就是置位！不可逆的哦    
//             } else {
//                 throw new Error("A promise can only be resolved once.");
//             }

//         },
//         promise: promise,
//     }
// }

// (8) 简单些点。。。
var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = _value;
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    var callback = pending[i];
                    callback(value);
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (callback) {
                if (pending) {
                    pending.push(callback);
                } else {
                    callback(value);
                }
            }
        }
    };
};

// （9 - 1）两个 settimeout 如何协调都同时执行完了？
var oneOneSecondLater = function (callback) {
    setTimeout(function () {
        callback(1);
    }, 1000);
};

var twoOneSecondLater = function (callback) {
    var a, b;
    var consider = function () {
        if (a === undefined || b === undefined)
            return;
        callback(a + b);
    };
    oneOneSecondLater(function (_a) {
        a = _a;
        consider();
    });
    oneOneSecondLater(function (_b) {
        b = _b;
        consider();
    });
};

// twoOneSecondLater(function (c) {
//     console.log(2);
// });

// promise 的解法 （全文关键！）   ---- 关键没看明白，今天就放弃吧
// 有一个需要关注的 权力反转： callback(value)   -------    value.then(callback)
// 有两种 promise: ref 的 和 defer的
// var ref = function (value) {
//     if (value && typeof value.then === "function")
//         return value;
//     return {
//         then: function (callback) {
//             return ref(callback(value)); // 绝妙的设计， .then(function(){}) 返回的总是一个promise. 先执行 callback(), 然后将执行结果包装成 promise , 
//         }
//     };
// };
// var defer = function () {
//     var pending = [], value;
//     return {
//         resolve: function (_value) {
//             if (pending) {
//                 value = ref(_value); // values wrapped in a promise
//                 for (var i = 0, ii = pending.length; i < ii; i++) {
//                     var callback = pending[i];
//                     value.then(callback); // then called instead
//                 }
//                 pending = undefined;
//             }
//         },
//         promise: {
//             then: function (_callback) {
//                 var result = defer();  // 每一个 then 都会产生一个 新的 defer 对象
//                 // callback is wrapped so that its return
//                 // value is captured and used to resolve the promise
//                 // that "then" returns
//                 var callback = function (value) {
//                     result.resolve(_callback(value));
//                 };
//                 if (pending) {
//                     pending.push(callback);
//                 } else {
//                     value.then(callback);
//                 }
//                 return result.promise;
//             }
//         }
//     };
// };

// 这是星辰和大海！
// var a = oneOneSecondLater();
// var b = oneOneSecondLater();
// var c = a.then(function (a) {
//     return b.then(function (b) {
//         return a + b;
//     });
// });

var myMoudles = (function () {
    var modules = {};
    return {
        define: function (name, deps, func) {
            if (modules[name]) {
                return;
            }

            var depObject = {};
            deps.forEach(dep => {
                depObject[dep] = modules[dep];
            })

            modules[name] = func.call(null, depObject);
        },
        get: function (name) {
            if (modules[name]) {
                return modules[name];
            } else {
                throw new Error(`${name} module has not been defined!`)
            }
        }
    }
})();

myMoudles.define('bar', [], function () {
    function hello(name) {
        return 'let introduce: ' + name;
    }
    return {
        hello: hello
    }
});
myMoudles.define('foo', ['bar'], function({bar}) {
    var hungry = 'hippo';
    function awesome() {
        console.log(bar.hello(hungry).toUpperCase());
    }
    return {
        awesome: awesome
    }
})
// var bar = myMoudles.get('bar');
// var foo = myMoudles.get('foo');

// foo.awesome()

// 参数解构
// function fn({a}) {
//     console.log('hello :' + a);
// }
// fn({a: 'kk'});

// function curryFunc(func) {
//     var args = [];
//     if (func.length === 0) {
//         return func.apply(null);  // 直接执行了，不返回函数了
//     }
//     return function fn() {
//         args = [...args, ...Array.from(arguments)];

//         if (args.length >= func.length) {
//             // return func.apply(null, args.slice(func.length)); // 错误
//             return func.apply(null, args.slice(0, func.length));
//         }

//         // 参数不够
//         if (args.length < func.length) {
//             // return function () {
//             //     return fn.apply(null, arguments);
//             // }
//             return fn;
//         }
//     }
// }

// 简化
// function curryFunc(func) {
//     var args = [];
//     if (func.length === 0) {
//         return func.apply(null);  // 直接执行了，不返回函数了
//     }
//     return function fn() {
//         args = [...args, ...Array.from(arguments)];

//         if (args.length >= func.length) {
//             return func.apply(null, args);
//         }

//         return fn;  // fn 单纯接受参数，条件够了 就执行，否则继续收参数
//     }
// }

// function add(x, y, z) {
//     return x + y + z;
// }
// var a = curryFunc(add);
// var b = a(1, 2);
// var c = b(3)
// console.log("result 1: ", curryFunc(add)(1, 2)(3));
// console.log("result 1: ", curryFunc(add)(1, 2, 3));
// console.log("result 2: ", curryFunc(add)(1)(2, 3));
// console.log("result 3: ", curryFunc(add)(1)(3)(2));
// function mul(x, y, z) {
//     return x * y * z;
// }
// console.log("result 1:", curryFunc(mul)(2, 4)(6));
// console.log("result 2:", curryFunc(mul)(2)(4,6));
// console.log("result 3:", curryFunc(mul)(2)(6)(4));

// function sayHello() {
//     return "hello";
// }
// console.log(curryFunc(sayHello));

// function fn(params) {
//     var a = 'fn-a';
//     var c = {
//         a: () => {
//             console.log(this)
//             this.helper();
//         },
//         b: function () {
//             console.log(this.helper())
//         },

//         helper: function () { },
//     }
//     return c;
// }

// var f = fn();
// f.a();

// (1)
// function *foo() {
//     var x = yield 2;
//     z++;
//     var y = yield (x * z);
//     console.log('foo:', x, y, z)
// }
// var z = 1;

// var it = foo();
// console.log(it.next().value) // 2
// console.log(it.next(1).value) // 给第一个yeild赋值1，执行第一个yeild 和 第二个yeild 之间的代码, var x = 1; z++; yield 返回 2；
// console.log(it.next(3).value) // 给第二个yeild赋值3，执行第一个yeild 和 第三个yeild 之间的代码, console.log 的结果为 foo: 1, 3 ,2,

// (2)
var a = 1;
var b = 2;

function *foo() {
    a++;
    yield;
    b = b * a;
    a = (yield b) * 3;
}

function *bar() {
    b--;
    yield;
    a = (yield 8) + b;
    b = a * (yield 2);
}

function step(gen) {
    var it = gen();
    var last;

    return function () {
        // it.next()
        // last = it.next().value;   // 执行到yield之前停止，并把 yield 后面的返回值赋给 last;
        last = it.next(last).value;  // 在二次 next 时，把第一次的yield 出的值 还给 yield 自己。
    }
}

// var s = step(bar);
// s(); // b = 1
// s(); // a = (yield..
// s(); // a = 9, b = 9 * (yield...)
// s(); // b = 18

// console.log(a, b)

var s1 = step(foo);
var s2 = step(bar);

// s2()
// s1()
// s1()

// s2()
// s2()
// s2()
// s1()
// console.log(a, b)

// var a = [1, 3, 5, 7, 9]
// var it = a[Symbol.iterator]();
// console.log(it.next().value);
// console.log(it.next().value);
// console.log(it.next().value);
// console.log(it.next().value);
// console.log(it.next().value);

function alert(params) {
    console.log(params);
}
class Thenable {
    constructor(num) {
        this.num = num;
    }
    then(resolve, reject) {
        alert(resolve); // function() { native code }
        // resolve with this.num*2 after 1000ms
        setTimeout(() => resolve(this.num * 2), 1000); // (*)
    }
};

// new Thenable(1).then(val => console.log('p: ', val))

async function loadJson(url) {
    var response = await fetch(url);
    if (response.status == 200) {
        return response.json();
    } else {
        throw new Error(response.status);
    }
}

loadJson('no-such-user.json')
    .catch(alert);


async function demoGitHubUser() {
    let name = await prompt('Enter a name?', 'iliakan');

    try {
        let user = await loadJson(`https:\/\/api.github.com\/users\/${name}`);
        alert(`Full name: ${user.name}.`);
        return user;
    } catch(err) {
        if (err instanceof HttpError && err.response.status == 404) {
            alert("No such user, please reenter.");
            return demoGithubUser();
        } else {
            throw err;
        }
    }
}
