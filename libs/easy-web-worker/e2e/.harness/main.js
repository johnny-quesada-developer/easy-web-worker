"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../node_modules/easy-cancelable-promise/CancelablePromise.js
  var require_CancelablePromise = __commonJS({
    "../../node_modules/easy-cancelable-promise/CancelablePromise.js"(exports, module) {
      !function(e, n) {
        "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define([], n) : "object" == typeof exports ? exports["easy-cancelable-promise"] = n() : e["easy-cancelable-promise"] = n();
      }(exports, () => (() => {
        "use strict";
        var e = { 836: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.isCancelableAbortSignal = void 0;
          n2.isCancelableAbortSignal = function(e3) {
            return Boolean(null == e3 ? void 0 : e3.__is_cancelable_abort_signal);
          };
        }, 216: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.promise_identifier = n2.isCancelablePromise = void 0;
          var t2 = Symbol("promise_identifier");
          n2.promise_identifier = t2;
          n2.isCancelablePromise = function(e3) {
            return !!(null == e3 ? void 0 : e3[t2]);
          };
        }, 790: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.isPromise = void 0;
          n2.isPromise = function(e3) {
            return Promise.resolve(e3) === e3;
          };
        } }, n = {};
        function t(r2) {
          var o = n[r2];
          if (void 0 !== o) return o.exports;
          var c = n[r2] = { exports: {} };
          return e[r2](c, c.exports, t), c.exports;
        }
        var r = {};
        return (() => {
          var e2 = r;
          function n2(e3) {
            return n2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e4) {
              return typeof e4;
            } : function(e4) {
              return e4 && "function" == typeof Symbol && e4.constructor === Symbol && e4 !== Symbol.prototype ? "symbol" : typeof e4;
            }, n2(e3);
          }
          Object.defineProperty(e2, "__esModule", { value: true }), e2.toCancelablePromise = e2.CancelablePromise = void 0;
          var o, c = t(836), i = t(216), l = t(790);
          function a(e3, t2) {
            for (var r2 = 0; r2 < t2.length; r2++) {
              var o2 = t2[r2];
              o2.enumerable = o2.enumerable || false, o2.configurable = true, "value" in o2 && (o2.writable = true), Object.defineProperty(e3, (c2 = o2.key, i2 = void 0, i2 = function(e4, t3) {
                if ("object" !== n2(e4) || null === e4) return e4;
                var r3 = e4[Symbol.toPrimitive];
                if (void 0 !== r3) {
                  var o3 = r3.call(e4, t3 || "default");
                  if ("object" !== n2(o3)) return o3;
                  throw new TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === t3 ? String : Number)(e4);
              }(c2, "string"), "symbol" === n2(i2) ? i2 : String(i2)), o2);
            }
            var c2, i2;
          }
          function u(e3) {
            var t2 = d();
            return function() {
              var r2, o2 = y(e3);
              if (t2) {
                var c2 = y(this).constructor;
                r2 = Reflect.construct(o2, arguments, c2);
              } else r2 = o2.apply(this, arguments);
              return function(e4, t3) {
                if (t3 && ("object" === n2(t3) || "function" == typeof t3)) return t3;
                if (void 0 !== t3) throw new TypeError("Derived constructors may only return object or undefined");
                return s(e4);
              }(this, r2);
            };
          }
          function s(e3) {
            if (void 0 === e3) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return e3;
          }
          function f() {
            return f = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(e3, n3, t2) {
              var r2 = function(e4, n4) {
                for (; !Object.prototype.hasOwnProperty.call(e4, n4) && null !== (e4 = y(e4)); ) ;
                return e4;
              }(e3, n3);
              if (r2) {
                var o2 = Object.getOwnPropertyDescriptor(r2, n3);
                return o2.get ? o2.get.call(arguments.length < 3 ? e3 : t2) : o2.value;
              }
            }, f.apply(this, arguments);
          }
          function p(e3) {
            var n3 = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
            return p = function(e4) {
              if (null === e4 || (t2 = e4, -1 === Function.toString.call(t2).indexOf("[native code]"))) return e4;
              var t2;
              if ("function" != typeof e4) throw new TypeError("Super expression must either be null or a function");
              if (void 0 !== n3) {
                if (n3.has(e4)) return n3.get(e4);
                n3.set(e4, r2);
              }
              function r2() {
                return b(e4, arguments, y(this).constructor);
              }
              return r2.prototype = Object.create(e4.prototype, { constructor: { value: r2, enumerable: false, writable: true, configurable: true } }), v(r2, e4);
            }, p(e3);
          }
          function b(e3, n3, t2) {
            return b = d() ? Reflect.construct.bind() : function(e4, n4, t3) {
              var r2 = [null];
              r2.push.apply(r2, n4);
              var o2 = new (Function.bind.apply(e4, r2))();
              return t3 && v(o2, t3.prototype), o2;
            }, b.apply(null, arguments);
          }
          function d() {
            if ("undefined" == typeof Reflect || !Reflect.construct) return false;
            if (Reflect.construct.sham) return false;
            if ("function" == typeof Proxy) return true;
            try {
              return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
              })), true;
            } catch (e3) {
              return false;
            }
          }
          function v(e3, n3) {
            return v = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e4, n4) {
              return e4.__proto__ = n4, e4;
            }, v(e3, n3);
          }
          function y(e3) {
            return y = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e4) {
              return e4.__proto__ || Object.getPrototypeOf(e4);
            }, y(e3);
          }
          var m = function(e3) {
            !function(e4, n4) {
              if ("function" != typeof n4 && null !== n4) throw new TypeError("Super expression must either be null or a function");
              e4.prototype = Object.create(n4 && n4.prototype, { constructor: { value: e4, writable: true, configurable: true } }), Object.defineProperty(e4, "prototype", { writable: false }), n4 && v(e4, n4);
            }(l2, e3);
            var n3, t2, r2, i2 = u(l2);
            function l2(e4) {
              var n4, t3, r3, a2, u2, p2;
              return function(e5, n5) {
                if (!(e5 instanceof n5)) throw new TypeError("Cannot call a class as a function");
              }(this, l2), (a2 = i2.call(this, function(e5, n5) {
                u2 = e5, p2 = n5;
              }))[o] = true, a2.status = "pending", a2.cancelCallbacks = /* @__PURE__ */ new Set(), a2.ownCancelCallbacks = /* @__PURE__ */ new Set(), a2.onProgressCallbacks = /* @__PURE__ */ new Set(), a2.disposeCallbacks = function() {
                a2.cancelCallbacks = /* @__PURE__ */ new Set(), a2.ownCancelCallbacks = /* @__PURE__ */ new Set(), a2.onProgressCallbacks = /* @__PURE__ */ new Set();
              }, a2.subscribeToOwnCancelEvent = function(e5) {
                return a2.ownCancelCallbacks.add(e5), function() {
                  a2.ownCancelCallbacks.delete(e5);
                };
              }, a2.cancel = function(e5) {
                if ("pending" !== a2.status) return s(a2);
                a2.status = "canceled";
                var n5 = void 0 === e5 ? new Error("Promise canceled") : e5;
                return a2.ownCancelCallbacks.forEach(function(e6) {
                  return e6(n5);
                }), a2.cancelCallbacks.forEach(function(e6) {
                  return e6(n5);
                }), a2._reject(n5), a2.disposeCallbacks(), s(a2);
              }, a2.onCancel = function(e5) {
                var n5 = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).signal;
                return a2.cancelCallbacks.add(e5), (0, c.isCancelableAbortSignal)(n5) ? n5.subscribe(function() {
                  a2.cancelCallbacks.delete(e5);
                }) : null == n5 || n5.addEventListener("abort", function() {
                  a2.cancelCallbacks.delete(e5);
                }), s(a2);
              }, a2.onProgress = function(e5) {
                var n5 = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).signal;
                return a2.onProgressCallbacks.add(e5), (0, c.isCancelableAbortSignal)(n5) ? n5.subscribe(function() {
                  a2.onProgressCallbacks.delete(e5);
                }) : null == n5 || n5.addEventListener("abort", function() {
                  a2.onProgressCallbacks.delete(e5);
                }), s(a2);
              }, a2.reportProgress = function(e5, n5) {
                return a2.onProgressCallbacks.forEach(function(t4) {
                  return t4(e5, n5);
                }), s(a2);
              }, a2.createChildPromise = function() {
                var e5, n5, t4 = new l2(function(t5, r4, o2) {
                  e5 = t5, n5 = r4;
                });
                return t4.onProgressCallbacks = a2.onProgressCallbacks, t4.onCancel(function(e6) {
                  a2.cancel(e6);
                }), { promise: t4, resolve: e5, reject: n5 };
              }, a2._resolve = u2, a2._reject = p2, e4(function(e5) {
                a2.status = "resolved", a2.disposeCallbacks(), a2._resolve(e5);
              }, function(e5) {
                a2.status = "rejected", a2.disposeCallbacks(), a2._reject(e5);
              }, { cancel: function(e5) {
                return a2.cancel(e5);
              }, onCancel: function(e5) {
                return a2.subscribeToOwnCancelEvent(e5);
              }, onProgress: function(e5) {
                return a2.onProgress(e5), function() {
                  a2.onProgressCallbacks.delete(e5);
                };
              }, reportProgress: function(e5, n5) {
                a2.reportProgress(e5, n5);
              } }), a2.then = function(e5, t4) {
                var r4 = a2.createChildPromise(), o2 = r4.promise, c2 = r4.resolve, i3 = r4.reject;
                return f((n4 = s(a2), y(l2.prototype)), "then", n4).call(n4, e5, t4).then(c2, i3), o2;
              }, a2.catch = function(e5) {
                var n5 = a2.createChildPromise(), r4 = n5.promise, o2 = n5.resolve, c2 = n5.reject;
                return f((t3 = s(a2), y(l2.prototype)), "catch", t3).call(t3, e5).then(o2, c2), r4;
              }, a2.finally = function(e5) {
                var n5 = a2.createChildPromise(), t4 = n5.promise, o2 = n5.resolve, c2 = n5.reject;
                return f((r3 = s(a2), y(l2.prototype)), "finally", r3).call(r3, e5).then(o2, c2), t4;
              }, a2;
            }
            return n3 = l2, r2 = [{ key: "resolve", value: function(e4) {
              return new l2(function(n4) {
                return n4(e4);
              });
            } }], (t2 = null) && a(n3.prototype, t2), r2 && a(n3, r2), Object.defineProperty(n3, "prototype", { writable: false }), l2;
          }(p(Promise));
          e2.CancelablePromise = m, o = i.promise_identifier, m.reject = function(e3) {
            return new m(function(n3, t2) {
              return t2(e3);
            });
          }, m.canceled = function(e3) {
            return new m(function(n3, t2, r2) {
              return (0, r2.cancel)(e3);
            });
          }, m.race = function(e3) {
            return new m(function(n3, t2, r2) {
              var o2 = r2.onCancel, c2 = r2.cancel;
              e3.forEach(function(e4) {
                var r3 = C(e4);
                o2(function(e5) {
                  r3.cancel(e5);
                }), r3.then(n3, function(e5) {
                  "canceled" !== r3.status ? t2(e5) : c2(e5);
                });
              });
            });
          }, m.all = function(e3) {
            return new m(function(n3, t2, r2) {
              var o2 = r2.onCancel, c2 = r2.cancel, i2 = /* @__PURE__ */ new Map(), l2 = e3.length, a2 = 0;
              e3.forEach(function(e4) {
                var r3 = C(e4);
                i2.set(r3, null), o2(function(e5) {
                  r3.cancel(e5);
                }), r3.then(function(e5) {
                  a2++, i2.set(r3, e5), a2 === l2 && n3(Array.from(i2.values()));
                }, function(e5) {
                  "canceled" !== r3.status ? t2(e5) : c2(e5);
                });
              });
            });
          }, m.allSettled = function(e3) {
            return new m(function(n3, t2, r2) {
              var o2 = r2.onCancel, c2 = /* @__PURE__ */ new Map(), i2 = e3.length, l2 = 0;
              e3.forEach(function(e4) {
                var t3 = C(e4);
                c2.set(t3, null), o2(function(e5) {
                  t3.cancel(e5);
                }), t3.then(function(e5) {
                  c2.set(t3, { status: "fulfilled", value: e5 });
                }, function(e5) {
                  c2.set(t3, { status: "canceled" === t3.status ? "canceled" : "rejected", reason: e5 });
                }).finally(function() {
                  ++l2 === i2 && n3(Array.from(c2.values()));
                });
              });
            });
          }, m.prototype.constructor = Promise;
          var C = function e3(n3) {
            if ((0, i.isCancelablePromise)(n3)) return n3;
            if ("function" == typeof n3) return e3(n3());
            if (!(0, l.isPromise)(n3)) return new m(function(e4) {
              return e4(n3);
            });
            var t2, r2, o2 = new m(function(e4, o3, c2) {
              t2 = e4, r2 = o3, n3.then(t2, r2);
            });
            return o2.onCancel(function(e4) {
              r2(e4);
            }), o2;
          };
          e2.toCancelablePromise = C;
        })(), r;
      })());
    }
  });

  // ../../node_modules/easy-cancelable-promise/groupAsCancelablePromise.js
  var require_groupAsCancelablePromise = __commonJS({
    "../../node_modules/easy-cancelable-promise/groupAsCancelablePromise.js"(exports, module) {
      !function(e, n) {
        "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define([], n) : "object" == typeof exports ? exports["easy-cancelable-promise"] = n() : e["easy-cancelable-promise"] = n();
      }(exports, () => (() => {
        "use strict";
        var e = { 0: (e2, n2, t2) => {
          function r2(e3) {
            return r2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e4) {
              return typeof e4;
            } : function(e4) {
              return e4 && "function" == typeof Symbol && e4.constructor === Symbol && e4 !== Symbol.prototype ? "symbol" : typeof e4;
            }, r2(e3);
          }
          Object.defineProperty(n2, "__esModule", { value: true }), n2.toCancelablePromise = n2.CancelablePromise = void 0;
          var o, c = t2(836), l = t2(216), i = t2(790);
          function a(e3, n3) {
            for (var t3 = 0; t3 < n3.length; t3++) {
              var o2 = n3[t3];
              o2.enumerable = o2.enumerable || false, o2.configurable = true, "value" in o2 && (o2.writable = true), Object.defineProperty(e3, (c2 = o2.key, l2 = void 0, l2 = function(e4, n4) {
                if ("object" !== r2(e4) || null === e4) return e4;
                var t4 = e4[Symbol.toPrimitive];
                if (void 0 !== t4) {
                  var o3 = t4.call(e4, n4 || "default");
                  if ("object" !== r2(o3)) return o3;
                  throw new TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === n4 ? String : Number)(e4);
              }(c2, "string"), "symbol" === r2(l2) ? l2 : String(l2)), o2);
            }
            var c2, l2;
          }
          function u(e3) {
            var n3 = d();
            return function() {
              var t3, o2 = y(e3);
              if (n3) {
                var c2 = y(this).constructor;
                t3 = Reflect.construct(o2, arguments, c2);
              } else t3 = o2.apply(this, arguments);
              return function(e4, n4) {
                if (n4 && ("object" === r2(n4) || "function" == typeof n4)) return n4;
                if (void 0 !== n4) throw new TypeError("Derived constructors may only return object or undefined");
                return s(e4);
              }(this, t3);
            };
          }
          function s(e3) {
            if (void 0 === e3) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return e3;
          }
          function f() {
            return f = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(e3, n3, t3) {
              var r3 = function(e4, n4) {
                for (; !Object.prototype.hasOwnProperty.call(e4, n4) && null !== (e4 = y(e4)); ) ;
                return e4;
              }(e3, n3);
              if (r3) {
                var o2 = Object.getOwnPropertyDescriptor(r3, n3);
                return o2.get ? o2.get.call(arguments.length < 3 ? e3 : t3) : o2.value;
              }
            }, f.apply(this, arguments);
          }
          function p(e3) {
            var n3 = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
            return p = function(e4) {
              if (null === e4 || (t3 = e4, -1 === Function.toString.call(t3).indexOf("[native code]"))) return e4;
              var t3;
              if ("function" != typeof e4) throw new TypeError("Super expression must either be null or a function");
              if (void 0 !== n3) {
                if (n3.has(e4)) return n3.get(e4);
                n3.set(e4, r3);
              }
              function r3() {
                return b(e4, arguments, y(this).constructor);
              }
              return r3.prototype = Object.create(e4.prototype, { constructor: { value: r3, enumerable: false, writable: true, configurable: true } }), v(r3, e4);
            }, p(e3);
          }
          function b(e3, n3, t3) {
            return b = d() ? Reflect.construct.bind() : function(e4, n4, t4) {
              var r3 = [null];
              r3.push.apply(r3, n4);
              var o2 = new (Function.bind.apply(e4, r3))();
              return t4 && v(o2, t4.prototype), o2;
            }, b.apply(null, arguments);
          }
          function d() {
            if ("undefined" == typeof Reflect || !Reflect.construct) return false;
            if (Reflect.construct.sham) return false;
            if ("function" == typeof Proxy) return true;
            try {
              return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
              })), true;
            } catch (e3) {
              return false;
            }
          }
          function v(e3, n3) {
            return v = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e4, n4) {
              return e4.__proto__ = n4, e4;
            }, v(e3, n3);
          }
          function y(e3) {
            return y = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e4) {
              return e4.__proto__ || Object.getPrototypeOf(e4);
            }, y(e3);
          }
          var m = function(e3) {
            !function(e4, n4) {
              if ("function" != typeof n4 && null !== n4) throw new TypeError("Super expression must either be null or a function");
              e4.prototype = Object.create(n4 && n4.prototype, { constructor: { value: e4, writable: true, configurable: true } }), Object.defineProperty(e4, "prototype", { writable: false }), n4 && v(e4, n4);
            }(i2, e3);
            var n3, t3, r3, l2 = u(i2);
            function i2(e4) {
              var n4, t4, r4, a2, u2, p2;
              return function(e5, n5) {
                if (!(e5 instanceof n5)) throw new TypeError("Cannot call a class as a function");
              }(this, i2), (a2 = l2.call(this, function(e5, n5) {
                u2 = e5, p2 = n5;
              }))[o] = true, a2.status = "pending", a2.cancelCallbacks = /* @__PURE__ */ new Set(), a2.ownCancelCallbacks = /* @__PURE__ */ new Set(), a2.onProgressCallbacks = /* @__PURE__ */ new Set(), a2.disposeCallbacks = function() {
                a2.cancelCallbacks = /* @__PURE__ */ new Set(), a2.ownCancelCallbacks = /* @__PURE__ */ new Set(), a2.onProgressCallbacks = /* @__PURE__ */ new Set();
              }, a2.subscribeToOwnCancelEvent = function(e5) {
                return a2.ownCancelCallbacks.add(e5), function() {
                  a2.ownCancelCallbacks.delete(e5);
                };
              }, a2.cancel = function(e5) {
                if ("pending" !== a2.status) return s(a2);
                a2.status = "canceled";
                var n5 = void 0 === e5 ? new Error("Promise canceled") : e5;
                return a2.ownCancelCallbacks.forEach(function(e6) {
                  return e6(n5);
                }), a2.cancelCallbacks.forEach(function(e6) {
                  return e6(n5);
                }), a2._reject(n5), a2.disposeCallbacks(), s(a2);
              }, a2.onCancel = function(e5) {
                var n5 = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).signal;
                return a2.cancelCallbacks.add(e5), (0, c.isCancelableAbortSignal)(n5) ? n5.subscribe(function() {
                  a2.cancelCallbacks.delete(e5);
                }) : null == n5 || n5.addEventListener("abort", function() {
                  a2.cancelCallbacks.delete(e5);
                }), s(a2);
              }, a2.onProgress = function(e5) {
                var n5 = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).signal;
                return a2.onProgressCallbacks.add(e5), (0, c.isCancelableAbortSignal)(n5) ? n5.subscribe(function() {
                  a2.onProgressCallbacks.delete(e5);
                }) : null == n5 || n5.addEventListener("abort", function() {
                  a2.onProgressCallbacks.delete(e5);
                }), s(a2);
              }, a2.reportProgress = function(e5, n5) {
                return a2.onProgressCallbacks.forEach(function(t5) {
                  return t5(e5, n5);
                }), s(a2);
              }, a2.createChildPromise = function() {
                var e5, n5, t5 = new i2(function(t6, r5, o2) {
                  e5 = t6, n5 = r5;
                });
                return t5.onProgressCallbacks = a2.onProgressCallbacks, t5.onCancel(function(e6) {
                  a2.cancel(e6);
                }), { promise: t5, resolve: e5, reject: n5 };
              }, a2._resolve = u2, a2._reject = p2, e4(function(e5) {
                a2.status = "resolved", a2.disposeCallbacks(), a2._resolve(e5);
              }, function(e5) {
                a2.status = "rejected", a2.disposeCallbacks(), a2._reject(e5);
              }, { cancel: function(e5) {
                return a2.cancel(e5);
              }, onCancel: function(e5) {
                return a2.subscribeToOwnCancelEvent(e5);
              }, onProgress: function(e5) {
                return a2.onProgress(e5), function() {
                  a2.onProgressCallbacks.delete(e5);
                };
              }, reportProgress: function(e5, n5) {
                a2.reportProgress(e5, n5);
              } }), a2.then = function(e5, t5) {
                var r5 = a2.createChildPromise(), o2 = r5.promise, c2 = r5.resolve, l3 = r5.reject;
                return f((n4 = s(a2), y(i2.prototype)), "then", n4).call(n4, e5, t5).then(c2, l3), o2;
              }, a2.catch = function(e5) {
                var n5 = a2.createChildPromise(), r5 = n5.promise, o2 = n5.resolve, c2 = n5.reject;
                return f((t4 = s(a2), y(i2.prototype)), "catch", t4).call(t4, e5).then(o2, c2), r5;
              }, a2.finally = function(e5) {
                var n5 = a2.createChildPromise(), t5 = n5.promise, o2 = n5.resolve, c2 = n5.reject;
                return f((r4 = s(a2), y(i2.prototype)), "finally", r4).call(r4, e5).then(o2, c2), t5;
              }, a2;
            }
            return n3 = i2, r3 = [{ key: "resolve", value: function(e4) {
              return new i2(function(n4) {
                return n4(e4);
              });
            } }], (t3 = null) && a(n3.prototype, t3), r3 && a(n3, r3), Object.defineProperty(n3, "prototype", { writable: false }), i2;
          }(p(Promise));
          n2.CancelablePromise = m, o = l.promise_identifier, m.reject = function(e3) {
            return new m(function(n3, t3) {
              return t3(e3);
            });
          }, m.canceled = function(e3) {
            return new m(function(n3, t3, r3) {
              return (0, r3.cancel)(e3);
            });
          }, m.race = function(e3) {
            return new m(function(n3, t3, r3) {
              var o2 = r3.onCancel, c2 = r3.cancel;
              e3.forEach(function(e4) {
                var r4 = h(e4);
                o2(function(e5) {
                  r4.cancel(e5);
                }), r4.then(n3, function(e5) {
                  "canceled" !== r4.status ? t3(e5) : c2(e5);
                });
              });
            });
          }, m.all = function(e3) {
            return new m(function(n3, t3, r3) {
              var o2 = r3.onCancel, c2 = r3.cancel, l2 = /* @__PURE__ */ new Map(), i2 = e3.length, a2 = 0;
              e3.forEach(function(e4) {
                var r4 = h(e4);
                l2.set(r4, null), o2(function(e5) {
                  r4.cancel(e5);
                }), r4.then(function(e5) {
                  a2++, l2.set(r4, e5), a2 === i2 && n3(Array.from(l2.values()));
                }, function(e5) {
                  "canceled" !== r4.status ? t3(e5) : c2(e5);
                });
              });
            });
          }, m.allSettled = function(e3) {
            return new m(function(n3, t3, r3) {
              var o2 = r3.onCancel, c2 = /* @__PURE__ */ new Map(), l2 = e3.length, i2 = 0;
              e3.forEach(function(e4) {
                var t4 = h(e4);
                c2.set(t4, null), o2(function(e5) {
                  t4.cancel(e5);
                }), t4.then(function(e5) {
                  c2.set(t4, { status: "fulfilled", value: e5 });
                }, function(e5) {
                  c2.set(t4, { status: "canceled" === t4.status ? "canceled" : "rejected", reason: e5 });
                }).finally(function() {
                  ++i2 === l2 && n3(Array.from(c2.values()));
                });
              });
            });
          }, m.prototype.constructor = Promise;
          var h = function e3(n3) {
            if ((0, l.isCancelablePromise)(n3)) return n3;
            if ("function" == typeof n3) return e3(n3());
            if (!(0, i.isPromise)(n3)) return new m(function(e4) {
              return e4(n3);
            });
            var t3, r3, o2 = new m(function(e4, o3, c2) {
              t3 = e4, r3 = o3, n3.then(t3, r3);
            });
            return o2.onCancel(function(e4) {
              r3(e4);
            }), o2;
          };
          n2.toCancelablePromise = h;
        }, 836: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.isCancelableAbortSignal = void 0;
          n2.isCancelableAbortSignal = function(e3) {
            return Boolean(null == e3 ? void 0 : e3.__is_cancelable_abort_signal);
          };
        }, 216: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.promise_identifier = n2.isCancelablePromise = void 0;
          var t2 = Symbol("promise_identifier");
          n2.promise_identifier = t2;
          n2.isCancelablePromise = function(e3) {
            return !!(null == e3 ? void 0 : e3[t2]);
          };
        }, 790: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.isPromise = void 0;
          n2.isPromise = function(e3) {
            return Promise.resolve(e3) === e3;
          };
        }, 710: (e2, n2, t2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), Object.defineProperty(n2, "toCancelablePromise", { enumerable: true, get: function() {
            return r2.toCancelablePromise;
          } });
          var r2 = t2(0);
        } }, n = {};
        function t(r2) {
          var o = n[r2];
          if (void 0 !== o) return o.exports;
          var c = n[r2] = { exports: {} };
          return e[r2](c, c.exports, t), c.exports;
        }
        var r = {};
        return (() => {
          var e2 = r;
          Object.defineProperty(e2, "__esModule", { value: true }), e2.groupAsCancelablePromise = void 0;
          var n2 = t(710), o = t(0);
          function c(e3) {
            return function(e4) {
              if (Array.isArray(e4)) return l(e4);
            }(e3) || function(e4) {
              if ("undefined" != typeof Symbol && null != e4[Symbol.iterator] || null != e4["@@iterator"]) return Array.from(e4);
            }(e3) || function(e4, n3) {
              if (!e4) return;
              if ("string" == typeof e4) return l(e4, n3);
              var t2 = Object.prototype.toString.call(e4).slice(8, -1);
              "Object" === t2 && e4.constructor && (t2 = e4.constructor.name);
              if ("Map" === t2 || "Set" === t2) return Array.from(e4);
              if ("Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2)) return l(e4, n3);
            }(e3) || function() {
              throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }();
          }
          function l(e3, n3) {
            (null == n3 || n3 > e3.length) && (n3 = e3.length);
            for (var t2 = 0, r2 = new Array(n3); t2 < n3; t2++) r2[t2] = e3[t2];
            return r2;
          }
          e2.groupAsCancelablePromise = function(e3) {
            var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
            if (!e3.length) return null;
            var r2 = t2.maxConcurrent, l2 = void 0 === r2 ? 8 : r2, i = t2.executeInOrder, a = void 0 !== i && i, u = t2.beforeEachCallback, s = void 0 === u ? null : u, f = t2.afterEachCallback, p = void 0 === f ? null : f, b = t2.onQueueEmptyCallback, d = void 0 === b ? null : b, v = c(e3), y = [];
            return new o.CancelablePromise(function(t3, r3, o2) {
              (function t4() {
                if (v.length) {
                  var r4 = v.splice(0, l2).map(function(t5) {
                    var r5 = "function" == typeof t5 ? t5() : t5;
                    null == s || s();
                    var c2 = (0, n2.toCancelablePromise)(r5), l3 = o2.onCancel(function(e4) {
                      c2.cancel(e4);
                    });
                    return c2.then(function(n3) {
                      var t6, r6;
                      l3(), y.push(n3), null == p || p(n3), o2.reportProgress((null !== (t6 = y.length) && void 0 !== t6 ? t6 : 1) / (null !== (r6 = e3.length) && void 0 !== r6 ? r6 : 1) * 100);
                    }), a ? c2.then(function(e4) {
                      return e4;
                    }) : c2;
                  });
                  return Promise.all(r4).then(function() {
                    return t4();
                  });
                }
              })().then(function() {
                null == d || d(y), t3(y);
              });
            });
          };
        })(), r;
      })());
    }
  });

  // ../../node_modules/easy-cancelable-promise/createDecoupledPromise.js
  var require_createDecoupledPromise = __commonJS({
    "../../node_modules/easy-cancelable-promise/createDecoupledPromise.js"(exports, module) {
      !function(e, n) {
        "object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define([], n) : "object" == typeof exports ? exports["easy-cancelable-promise"] = n() : e["easy-cancelable-promise"] = n();
      }(exports, () => (() => {
        "use strict";
        var e = { 0: (e2, n2, t2) => {
          function r2(e3) {
            return r2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e4) {
              return typeof e4;
            } : function(e4) {
              return e4 && "function" == typeof Symbol && e4.constructor === Symbol && e4 !== Symbol.prototype ? "symbol" : typeof e4;
            }, r2(e3);
          }
          Object.defineProperty(n2, "__esModule", { value: true }), n2.toCancelablePromise = n2.CancelablePromise = void 0;
          var o, c = t2(836), i = t2(216), l = t2(790);
          function a(e3, n3) {
            for (var t3 = 0; t3 < n3.length; t3++) {
              var o2 = n3[t3];
              o2.enumerable = o2.enumerable || false, o2.configurable = true, "value" in o2 && (o2.writable = true), Object.defineProperty(e3, (c2 = o2.key, i2 = void 0, i2 = function(e4, n4) {
                if ("object" !== r2(e4) || null === e4) return e4;
                var t4 = e4[Symbol.toPrimitive];
                if (void 0 !== t4) {
                  var o3 = t4.call(e4, n4 || "default");
                  if ("object" !== r2(o3)) return o3;
                  throw new TypeError("@@toPrimitive must return a primitive value.");
                }
                return ("string" === n4 ? String : Number)(e4);
              }(c2, "string"), "symbol" === r2(i2) ? i2 : String(i2)), o2);
            }
            var c2, i2;
          }
          function u(e3) {
            var n3 = d();
            return function() {
              var t3, o2 = y(e3);
              if (n3) {
                var c2 = y(this).constructor;
                t3 = Reflect.construct(o2, arguments, c2);
              } else t3 = o2.apply(this, arguments);
              return function(e4, n4) {
                if (n4 && ("object" === r2(n4) || "function" == typeof n4)) return n4;
                if (void 0 !== n4) throw new TypeError("Derived constructors may only return object or undefined");
                return s(e4);
              }(this, t3);
            };
          }
          function s(e3) {
            if (void 0 === e3) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return e3;
          }
          function f() {
            return f = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(e3, n3, t3) {
              var r3 = function(e4, n4) {
                for (; !Object.prototype.hasOwnProperty.call(e4, n4) && null !== (e4 = y(e4)); ) ;
                return e4;
              }(e3, n3);
              if (r3) {
                var o2 = Object.getOwnPropertyDescriptor(r3, n3);
                return o2.get ? o2.get.call(arguments.length < 3 ? e3 : t3) : o2.value;
              }
            }, f.apply(this, arguments);
          }
          function p(e3) {
            var n3 = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
            return p = function(e4) {
              if (null === e4 || (t3 = e4, -1 === Function.toString.call(t3).indexOf("[native code]"))) return e4;
              var t3;
              if ("function" != typeof e4) throw new TypeError("Super expression must either be null or a function");
              if (void 0 !== n3) {
                if (n3.has(e4)) return n3.get(e4);
                n3.set(e4, r3);
              }
              function r3() {
                return b(e4, arguments, y(this).constructor);
              }
              return r3.prototype = Object.create(e4.prototype, { constructor: { value: r3, enumerable: false, writable: true, configurable: true } }), v(r3, e4);
            }, p(e3);
          }
          function b(e3, n3, t3) {
            return b = d() ? Reflect.construct.bind() : function(e4, n4, t4) {
              var r3 = [null];
              r3.push.apply(r3, n4);
              var o2 = new (Function.bind.apply(e4, r3))();
              return t4 && v(o2, t4.prototype), o2;
            }, b.apply(null, arguments);
          }
          function d() {
            if ("undefined" == typeof Reflect || !Reflect.construct) return false;
            if (Reflect.construct.sham) return false;
            if ("function" == typeof Proxy) return true;
            try {
              return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
              })), true;
            } catch (e3) {
              return false;
            }
          }
          function v(e3, n3) {
            return v = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e4, n4) {
              return e4.__proto__ = n4, e4;
            }, v(e3, n3);
          }
          function y(e3) {
            return y = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e4) {
              return e4.__proto__ || Object.getPrototypeOf(e4);
            }, y(e3);
          }
          var m = function(e3) {
            !function(e4, n4) {
              if ("function" != typeof n4 && null !== n4) throw new TypeError("Super expression must either be null or a function");
              e4.prototype = Object.create(n4 && n4.prototype, { constructor: { value: e4, writable: true, configurable: true } }), Object.defineProperty(e4, "prototype", { writable: false }), n4 && v(e4, n4);
            }(l2, e3);
            var n3, t3, r3, i2 = u(l2);
            function l2(e4) {
              var n4, t4, r4, a2, u2, p2;
              return function(e5, n5) {
                if (!(e5 instanceof n5)) throw new TypeError("Cannot call a class as a function");
              }(this, l2), (a2 = i2.call(this, function(e5, n5) {
                u2 = e5, p2 = n5;
              }))[o] = true, a2.status = "pending", a2.cancelCallbacks = /* @__PURE__ */ new Set(), a2.ownCancelCallbacks = /* @__PURE__ */ new Set(), a2.onProgressCallbacks = /* @__PURE__ */ new Set(), a2.disposeCallbacks = function() {
                a2.cancelCallbacks = /* @__PURE__ */ new Set(), a2.ownCancelCallbacks = /* @__PURE__ */ new Set(), a2.onProgressCallbacks = /* @__PURE__ */ new Set();
              }, a2.subscribeToOwnCancelEvent = function(e5) {
                return a2.ownCancelCallbacks.add(e5), function() {
                  a2.ownCancelCallbacks.delete(e5);
                };
              }, a2.cancel = function(e5) {
                if ("pending" !== a2.status) return s(a2);
                a2.status = "canceled";
                var n5 = void 0 === e5 ? new Error("Promise canceled") : e5;
                return a2.ownCancelCallbacks.forEach(function(e6) {
                  return e6(n5);
                }), a2.cancelCallbacks.forEach(function(e6) {
                  return e6(n5);
                }), a2._reject(n5), a2.disposeCallbacks(), s(a2);
              }, a2.onCancel = function(e5) {
                var n5 = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).signal;
                return a2.cancelCallbacks.add(e5), (0, c.isCancelableAbortSignal)(n5) ? n5.subscribe(function() {
                  a2.cancelCallbacks.delete(e5);
                }) : null == n5 || n5.addEventListener("abort", function() {
                  a2.cancelCallbacks.delete(e5);
                }), s(a2);
              }, a2.onProgress = function(e5) {
                var n5 = (arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}).signal;
                return a2.onProgressCallbacks.add(e5), (0, c.isCancelableAbortSignal)(n5) ? n5.subscribe(function() {
                  a2.onProgressCallbacks.delete(e5);
                }) : null == n5 || n5.addEventListener("abort", function() {
                  a2.onProgressCallbacks.delete(e5);
                }), s(a2);
              }, a2.reportProgress = function(e5, n5) {
                return a2.onProgressCallbacks.forEach(function(t5) {
                  return t5(e5, n5);
                }), s(a2);
              }, a2.createChildPromise = function() {
                var e5, n5, t5 = new l2(function(t6, r5, o2) {
                  e5 = t6, n5 = r5;
                });
                return t5.onProgressCallbacks = a2.onProgressCallbacks, t5.onCancel(function(e6) {
                  a2.cancel(e6);
                }), { promise: t5, resolve: e5, reject: n5 };
              }, a2._resolve = u2, a2._reject = p2, e4(function(e5) {
                a2.status = "resolved", a2.disposeCallbacks(), a2._resolve(e5);
              }, function(e5) {
                a2.status = "rejected", a2.disposeCallbacks(), a2._reject(e5);
              }, { cancel: function(e5) {
                return a2.cancel(e5);
              }, onCancel: function(e5) {
                return a2.subscribeToOwnCancelEvent(e5);
              }, onProgress: function(e5) {
                return a2.onProgress(e5), function() {
                  a2.onProgressCallbacks.delete(e5);
                };
              }, reportProgress: function(e5, n5) {
                a2.reportProgress(e5, n5);
              } }), a2.then = function(e5, t5) {
                var r5 = a2.createChildPromise(), o2 = r5.promise, c2 = r5.resolve, i3 = r5.reject;
                return f((n4 = s(a2), y(l2.prototype)), "then", n4).call(n4, e5, t5).then(c2, i3), o2;
              }, a2.catch = function(e5) {
                var n5 = a2.createChildPromise(), r5 = n5.promise, o2 = n5.resolve, c2 = n5.reject;
                return f((t4 = s(a2), y(l2.prototype)), "catch", t4).call(t4, e5).then(o2, c2), r5;
              }, a2.finally = function(e5) {
                var n5 = a2.createChildPromise(), t5 = n5.promise, o2 = n5.resolve, c2 = n5.reject;
                return f((r4 = s(a2), y(l2.prototype)), "finally", r4).call(r4, e5).then(o2, c2), t5;
              }, a2;
            }
            return n3 = l2, r3 = [{ key: "resolve", value: function(e4) {
              return new l2(function(n4) {
                return n4(e4);
              });
            } }], (t3 = null) && a(n3.prototype, t3), r3 && a(n3, r3), Object.defineProperty(n3, "prototype", { writable: false }), l2;
          }(p(Promise));
          n2.CancelablePromise = m, o = i.promise_identifier, m.reject = function(e3) {
            return new m(function(n3, t3) {
              return t3(e3);
            });
          }, m.canceled = function(e3) {
            return new m(function(n3, t3, r3) {
              return (0, r3.cancel)(e3);
            });
          }, m.race = function(e3) {
            return new m(function(n3, t3, r3) {
              var o2 = r3.onCancel, c2 = r3.cancel;
              e3.forEach(function(e4) {
                var r4 = C(e4);
                o2(function(e5) {
                  r4.cancel(e5);
                }), r4.then(n3, function(e5) {
                  "canceled" !== r4.status ? t3(e5) : c2(e5);
                });
              });
            });
          }, m.all = function(e3) {
            return new m(function(n3, t3, r3) {
              var o2 = r3.onCancel, c2 = r3.cancel, i2 = /* @__PURE__ */ new Map(), l2 = e3.length, a2 = 0;
              e3.forEach(function(e4) {
                var r4 = C(e4);
                i2.set(r4, null), o2(function(e5) {
                  r4.cancel(e5);
                }), r4.then(function(e5) {
                  a2++, i2.set(r4, e5), a2 === l2 && n3(Array.from(i2.values()));
                }, function(e5) {
                  "canceled" !== r4.status ? t3(e5) : c2(e5);
                });
              });
            });
          }, m.allSettled = function(e3) {
            return new m(function(n3, t3, r3) {
              var o2 = r3.onCancel, c2 = /* @__PURE__ */ new Map(), i2 = e3.length, l2 = 0;
              e3.forEach(function(e4) {
                var t4 = C(e4);
                c2.set(t4, null), o2(function(e5) {
                  t4.cancel(e5);
                }), t4.then(function(e5) {
                  c2.set(t4, { status: "fulfilled", value: e5 });
                }, function(e5) {
                  c2.set(t4, { status: "canceled" === t4.status ? "canceled" : "rejected", reason: e5 });
                }).finally(function() {
                  ++l2 === i2 && n3(Array.from(c2.values()));
                });
              });
            });
          }, m.prototype.constructor = Promise;
          var C = function e3(n3) {
            if ((0, i.isCancelablePromise)(n3)) return n3;
            if ("function" == typeof n3) return e3(n3());
            if (!(0, l.isPromise)(n3)) return new m(function(e4) {
              return e4(n3);
            });
            var t3, r3, o2 = new m(function(e4, o3, c2) {
              t3 = e4, r3 = o3, n3.then(t3, r3);
            });
            return o2.onCancel(function(e4) {
              r3(e4);
            }), o2;
          };
          n2.toCancelablePromise = C;
        }, 836: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.isCancelableAbortSignal = void 0;
          n2.isCancelableAbortSignal = function(e3) {
            return Boolean(null == e3 ? void 0 : e3.__is_cancelable_abort_signal);
          };
        }, 216: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.promise_identifier = n2.isCancelablePromise = void 0;
          var t2 = Symbol("promise_identifier");
          n2.promise_identifier = t2;
          n2.isCancelablePromise = function(e3) {
            return !!(null == e3 ? void 0 : e3[t2]);
          };
        }, 790: (e2, n2) => {
          Object.defineProperty(n2, "__esModule", { value: true }), n2.isPromise = void 0;
          n2.isPromise = function(e3) {
            return Promise.resolve(e3) === e3;
          };
        } }, n = {};
        function t(r2) {
          var o = n[r2];
          if (void 0 !== o) return o.exports;
          var c = n[r2] = { exports: {} };
          return e[r2](c, c.exports, t), c.exports;
        }
        var r = {};
        return (() => {
          var e2 = r;
          Object.defineProperty(e2, "__esModule", { value: true }), e2.createDecoupledPromise = void 0;
          var n2 = t(0);
          e2.createDecoupledPromise = function() {
            var e3, t2, r2, o = new n2.CancelablePromise(function(n3, o2, c) {
              e3 = n3, t2 = o2, r2 = c;
            });
            return Object.assign(Object.assign({ resolve: e3, reject: t2 }, r2), { promise: o });
          };
        })(), r;
      })());
    }
  });

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    EasyWebWorker: () => EasyWebWorker,
    StaticEasyWebWorker: () => StaticEasyWebWorker,
    createEasyWebWorker: () => createEasyWebWorker,
    createStaticEasyWebWorker: () => createStaticEasyWebWorker,
    default: () => EasyWebWorker
  });

  // src/EasyWebWorker.ts
  var import_CancelablePromise = __toESM(require_CancelablePromise());
  var import_groupAsCancelablePromise = __toESM(require_groupAsCancelablePromise());

  // src/EasyWebWorkerMessage.ts
  var import_createDecoupledPromise = __toESM(require_createDecoupledPromise());

  // src/uniqueId.ts
  var uniqueId = /* @__PURE__ */ (() => {
    let counter = 0;
    return (prefix = "") => {
      if (counter === Number.MAX_SAFE_INTEGER) counter = 0;
      return prefix + Date.now().toString(36) + (counter++).toString(36);
    };
  })();

  // src/EasyWebWorkerMessage.ts
  var EasyWebWorkerMessage = class {
    constructor() {
      this.messageId = uniqueId("ms:");
      this.decoupledPromise = (0, import_createDecoupledPromise.createDecoupledPromise)();
      this.decoupledPromise._cancel = this.decoupledPromise.promise.cancel;
    }
  };

  // src/getWorkerTemplate.ts
  var getWorkerTemplate = () => {
    const template = `(()=>{let e=new Map,o=new Map([["",()=>{throw"you didn't defined a message-callback, please assign a callback by calling easyWorker.onMessage"},],]),t=({messageId:o,payload:t,method:a})=>{let s="pending",n=new Map,r=(t,r,l=[])=>{var i;let c=s,d="progress"===t?"pending":t;if(!e.has(o)){let g="%c#"+o+" Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To now more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";console.error(g,"color: darkorange; font-size: 12px; font-weight: bold;","font-weight: normal;","font-weight: bold;","font-weight: normal;","color: lightblue; font-size: 10px; font-weight: bold;","font-weight: bold; color: darkorange;",{messageId:o,status:{current:c,target:d},method:a,action:r});return}let h={resolved:"onResolve",rejected:"onReject",canceled:"onCancel",worker_cancelation:"onCancel",pending:"onProgress"}[d],w=n.get(h),m=!r.progress;try{null==w||w.forEach(e=>e(r,l)),m&&(null===(i=n.get("onFinalize"))||void 0===i||i.forEach(e=>e(r,l)))}catch(u){throw e.delete(o),{message:"Error while processing message id: "+o,error:u,messageData:r,messageType:t,when:h}}finally{m&&e.delete(o)}self.postMessage(Object.assign({messageId:o},r),l),s=d},l=(e,o=[])=>r("resolved",{resolved:{payload:void 0===e?[]:[e]}},o),i=(e,o=[])=>{r("rejected",{rejected:{reason:e}},o)},c=(e,o=[])=>r("worker_cancelation",{worker_cancelation:{reason:e}},o),d=(e,o,t=[])=>{r("progress",{progress:{percentage:e,payload:o}},t)},g=e=>o=>{n.has(e)||n.set(e,new Set);let t=n.get(e);return t.add(o),()=>t.delete(o)};return{messageId:o,method:a,payload:t,getStatus:()=>s,isPending:()=>"pending"===s,resolve:l,reject:i,cancel:c,reportProgress:d,onResolve:g("onResolve"),onReject:g("onReject"),onCancel:g("onCancel"),onProgress:g("onProgress"),onFinalize:g("onFinalize")}},a=(...e)=>{let[t,a]=e,s="string"==typeof t;if(s){let n=t,r=a;o.set(n,r);return}let l=t;o.set("",l)},s=()=>{let o=[...e.values()];o.forEach(e=>e.reject(Error("worker closed"))),self.close()};self.onmessage=a=>{var s,n,r,l;let i=null===(s=null==a?void 0:a.data)||void 0===s?void 0:s.messageId,c=null!==(r=null===(n=null==a?void 0:a.data)||void 0===n?void 0:n.__is_easy_web_worker_message__)&&void 0!==r&&r,d=i&&c;if(d)try{let{data:g}=a,{cancelation:h}=g;if(h){let{reason:w}=h,m=e.get(i);null==m||m.cancel(w);return}let{method:u,execution:p}=a.data,{payload:v}=p,f=t({method:u,messageId:i,payload:v});e.set(i,f);let y=o.get(u||"");y(f,a)}catch(k){throw e.delete(null===(l=a.data)||void 0===l?void 0:l.messageId),{message:"Error while processing message id: "+i,event:a}}};let n=(...e)=>{self.importScripts(...e)};return{onMessage:a,close:s,importScripts:n}})();`;
    return template;
  };

  // src/createBlobWorker.ts
  var getImportScriptsTemplate = (scripts = []) => {
    if (!scripts.length) return "";
    return `self.importScripts(${scripts.map((script) => JSON.stringify(script)).join(",")});`;
  };
  var createBlobWorker = (source, imports = [], {
    primitiveParameters = []
  } = {}) => {
    const contentCollection = Array.isArray(source) ? source : [source];
    const worker_content = `${getImportScriptsTemplate(
      imports
    )}self.primitiveParameters=JSON.parse(\`${JSON.stringify(
      primitiveParameters ?? []
    )}\`);let ew$=${getWorkerTemplate()};let cn$=self;${contentCollection.map((content) => {
      return `
(${content?.toString().trim()})(ew$,cn$);`;
    }).join("")}`;
    return (window.URL || window.webkitURL).createObjectURL(
      new Blob([worker_content], { type: "application/javascript" })
    );
  };

  // src/EasyWebWorker.ts
  var EasyWebWorker = class {
    constructor(source, config = {}) {
      this.source = source;
      /**
       * This is the URL of the worker file
       */
      this.workerUrl = null;
      /**
       * Worker configuration
       */
      this.config = null;
      /**
       * @deprecated this will be removed in the next major version and keep it just inside the config object
       */
      this.maxWorkers = 1;
      /**
       * @deprecated avoid direct access to the workers unless you know what you are doing
       */
      this.workers = [];
      /**
       * @deprecated this will be removed in the next major version and keep it just inside the config object
       */
      this.keepAlive = true;
      /**
       * @deprecated this will be removed in the next major version and keep it just inside the config object
       */
      this.warmUpWorkers = false;
      /**
       * @deprecated this will be removed in the next major version and keep it just inside the config object
       */
      this.terminationDelay = 1e3;
      /**
       * @deprecated this will be removed in the next major version and keep it just inside the config object
       */
      this.primitiveParameters = [];
      /**
       * These where send to the worker but not yet resolved
       */
      this.messagesQueue = /* @__PURE__ */ new Map();
      /**
       * @deprecated this will be removed in the next major version to be grouped as a worker option object
       * This is the list of scripts that will be imported into the worker
       */
      this.scripts = [];
      this.warmUp = () => {
        const { warmUpWorkers, maxWorkers } = this.config;
        if (!warmUpWorkers) return;
        new Array(maxWorkers).fill(null).forEach(() => this.getWorkerFromPool());
      };
      this.fillWorkerMethods = (worker) => {
        worker.onmessage = (event) => {
          this.executeMessageCallback(event);
        };
        worker.onerror = (reason) => {
          const { onWorkerError } = this.config;
          if (!onWorkerError) throw reason;
          onWorkerError(reason);
        };
        return worker;
      };
      this.createNewWorker = () => {
        const { workerUrl } = this;
        const { workerOptions } = this.config;
        const name = (() => {
          const { length } = this.workers;
          if (length === 0) return workerOptions.name;
          return `${workerOptions.name}-${length}`;
        })();
        const worker = new Worker(workerUrl, { ...workerOptions, name });
        return this.fillWorkerMethods(worker);
      };
      this.getWorkerFromPool = () => {
        const { maxWorkers, warmUpWorkers } = this.config;
        const { messagesQueue } = this;
        const messagesQueueSize = messagesQueue.size;
        if (!this.workers.length || this.workers.length < maxWorkers && (messagesQueueSize || warmUpWorkers)) {
          const worker2 = this.createNewWorker();
          this.workers.push(worker2);
          return worker2;
        }
        const worker = this.workers.shift();
        this.workers.push(worker);
        return worker;
      };
      this.computeWorkerBaseSource = () => {
        const { workerUrl, isArrayOfWebWorkers } = (() => {
          const isWorkerInstance = this.source instanceof Worker;
          if (isWorkerInstance) {
            this.workers = [this.fillWorkerMethods(this.source)];
            return {
              isArrayOfWebWorkers: false,
              workerUrl: null
            };
          }
          const isUrlBase = typeof this.source === "string" || this.source instanceof URL;
          const isFunctionTemplate = typeof this.source === "function";
          if (isUrlBase || isFunctionTemplate) {
            const workerUrl2 = this.workerUrl ?? this.getWorkerUrl();
            return {
              isArrayOfWebWorkers: false,
              workerUrl: workerUrl2
            };
          }
          const isArraySource = Array.isArray(this.source);
          const isArrayOfFunctionsTemplates = isArraySource && typeof this.source[0] === "function";
          if (isArrayOfFunctionsTemplates) {
            const workerUrl2 = this.workerUrl ?? this.getWorkerUrl();
            return {
              isArrayOfWebWorkers: false,
              workerUrl: workerUrl2
            };
          }
          const isArrayOfWebWorkers2 = isArraySource && this.source[0] instanceof Worker;
          if (isArrayOfWebWorkers2) {
            this.workers = this.source.map(this.fillWorkerMethods);
            return {
              isArrayOfWebWorkers: isArrayOfWebWorkers2,
              workerUrl: null
            };
          }
          return {
            isArrayOfWebWorkers: false,
            workerUrl: null
          };
        })();
        this.workerUrl = workerUrl;
        this.config.maxWorkers = isArrayOfWebWorkers ? this.workers.length : this.config.maxWorkers;
        return { isArrayOfWebWorkers };
      };
      /**
       * Send a message to the worker queue
       * @param {TPayload} payload - whatever json data you want to send to the worker
       * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
       */
      this.send = (payload, transfer) => {
        return this.sendToWorker({ payload }, transfer);
      };
      this.sendToWorker = ({
        payload,
        method
      }, transfer) => {
        const message = new EasyWebWorkerMessage();
        const { messageId, decoupledPromise } = message;
        const worker = this.getWorkerFromPool();
        let isCancelationRequested = false;
        decoupledPromise.promise.cancel = (reason) => {
          if (!this.messagesQueue.has(messageId)) {
            return decoupledPromise.promise;
          }
          if (!this.workers.length) {
            this.RemoveMessageFromQueue(messageId);
            return decoupledPromise._cancel(reason);
          }
          if (isCancelationRequested) {
            return decoupledPromise.promise;
          }
          isCancelationRequested = true;
          const data2 = {
            messageId,
            __is_easy_web_worker_message__: true,
            method,
            cancelation: {
              reason
            }
          };
          worker.postMessage(data2);
          return decoupledPromise.promise;
        };
        if (!this.config.keepAlive) {
          decoupledPromise.promise?.finally?.(() => {
            setTimeout(() => {
              const { messagesQueue } = this;
              if (messagesQueue.size) return;
              this.workers.forEach((worker2) => worker2.terminate());
              this.workers = [];
            }, this.config.terminationDelay);
          }).catch(() => {
          });
        }
        this.addMessageToQueue(message);
        const data = {
          messageId,
          __is_easy_web_worker_message__: true,
          method,
          execution: {
            payload
          }
        };
        try {
          worker.postMessage(data, transfer);
        } catch (error) {
          this.RemoveMessageFromQueue(messageId);
          throw error;
        }
        return decoupledPromise.promise;
      };
      /**
       * This method terminate all current messages and send a new one to the worker queue
       * @param {TPayload} payload - whatever json data you want to send to the worker, should be serializable
       * @param {unknown} reason - reason why the worker was terminated
       * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
       */
      this.override = (...[payload, reason, config]) => {
        return new import_CancelablePromise.CancelablePromise(async (resolve, _, { onCancel }) => {
          const cancelAllPromise = this.cancelAll(reason, config);
          const unsubscribe = onCancel(() => {
            cancelAllPromise.cancel();
          });
          await cancelAllPromise;
          unsubscribe();
          resolve(this.send(...[payload]));
        });
      };
      /**
       * This method will alow the current message to be completed and send a new one to the worker queue after it, all the messages after the current one will be canceled
       * @param {TPayload} payload - whatever json data you want to send to the worker should be serializable
       * @param {unknown} reason - reason why the worker was terminated
       * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
       */
      this.overrideAfterCurrent = (...[payload, reason, config]) => {
        return new import_CancelablePromise.CancelablePromise(
          async (resolve, _, { onCancel, reportProgress }) => {
            if (this.messagesQueue.size) {
              const [firstItem] = this.messagesQueue;
              const [, currentMessage] = firstItem;
              this.RemoveMessageFromQueue(currentMessage.messageId);
              const cancelAllPromise = this.cancelAll(reason, config).onProgress(
                reportProgress
              );
              const unsubscribe = onCancel(() => {
                cancelAllPromise.cancel();
              });
              this.addMessageToQueue(currentMessage);
              await cancelAllPromise;
              unsubscribe();
            }
            resolve(this.send(...[payload]));
          }
        );
      };
      this.workerUrl = typeof source === "string" || source instanceof URL ? source : null;
      const {
        scripts = [],
        name,
        onWorkerError = null,
        maxWorkers = 1,
        terminationDelay = 1e3,
        primitiveParameters,
        workerOptions = {}
      } = config ?? {};
      const warmUpWorkers = (() => {
        if (typeof config?.warmUpWorkers === "boolean")
          return config.warmUpWorkers;
        const defaultWarmUpSingleWorker = maxWorkers === 1;
        if (defaultWarmUpSingleWorker) return true;
        return false;
      })();
      let keepAlive = (() => {
        if (typeof config?.keepAlive === "boolean") return config.keepAlive;
        return warmUpWorkers;
      })();
      this.config = {
        scripts: scripts ?? [],
        name,
        maxWorkers,
        keepAlive,
        warmUpWorkers,
        workerOptions: {
          ...workerOptions ?? {},
          name: workerOptions.name || uniqueId("wk:")
        },
        onWorkerError,
        terminationDelay,
        primitiveParameters
      };
      this.workerOptions = this.config.workerOptions;
      this.name = this.workerOptions.name;
      this.scripts = scripts;
      this.onWorkerError = onWorkerError;
      this.maxWorkers = maxWorkers;
      this.terminationDelay = terminationDelay;
      this.warmUpWorkers = warmUpWorkers;
      this.primitiveParameters = primitiveParameters ?? [];
      const { isArrayOfWebWorkers } = this.computeWorkerBaseSource();
      keepAlive = isArrayOfWebWorkers ? true : keepAlive;
      this.keepAlive = keepAlive;
      this.config.keepAlive = keepAlive;
      this.warmUp();
    }
    /**
     * @deprecated Directly modifying the worker may lead to unexpected behavior. Use it only if you know what you are doing.
     * this property will be removed in the next major version
     */
    get worker() {
      return this.workers.length > 1 ? null : this.workers[0];
    }
    get isExternalWorkerFile() {
      return typeof this.source === "string" || this.source instanceof URL;
    }
    RemoveMessageFromQueue(messageId) {
      this.messagesQueue.delete(messageId);
    }
    /**
     * Categorizes the worker response and executes the corresponding callback
     */
    executeMessageCallback(event) {
      const message = this.messagesQueue.get(event.data.messageId) ?? null;
      if (!message) return;
      const { progress } = event.data;
      if (!this.workers.length) {
        this.RemoveMessageFromQueue(message.messageId);
        return;
      }
      const { decoupledPromise } = message;
      if (progress) {
        const { percentage, payload: payload2 } = progress;
        decoupledPromise.reportProgress(percentage, payload2);
        return;
      }
      this.RemoveMessageFromQueue(message.messageId);
      const { worker_cancelation } = event.data;
      if (worker_cancelation) {
        const { reason } = worker_cancelation;
        decoupledPromise._cancel(reason);
        return;
      }
      const { rejected } = event.data;
      if (rejected) {
        const { reason } = rejected;
        decoupledPromise.reject(reason);
        return;
      }
      const { resolved } = event.data;
      const { payload } = resolved;
      decoupledPromise.resolve(
        ...payload ?? []
      );
    }
    getWorkerUrl() {
      if (this.isExternalWorkerFile) {
        return this.source;
      }
      const { primitiveParameters, scripts } = this.config;
      return createBlobWorker(
        this.source,
        scripts,
        {
          primitiveParameters
        }
      );
    }
    /**
     * Execute the cancel callback of each message in the queue if provided
     * @param {unknown} reason - reason messages where canceled
     * @param {boolean} force - if true, the messages will be cancelled immediately without waiting for the worker to respond
     * This action will reboot the worker
     */
    cancelAll(reason, { force = false } = {}) {
      return new import_CancelablePromise.CancelablePromise(
        async (resolve, _, { onCancel, reportProgress }) => {
          const messages = Array.from(this.messagesQueue?.values() ?? []);
          const total = messages.length;
          const percentage = 100 / total;
          if (force) {
            return resolve(this.reboot(reason));
          }
          if (!total) {
            return resolve();
          }
          const resultsPromise = (0, import_groupAsCancelablePromise.groupAsCancelablePromise)(
            messages.map((message) => {
              const { decoupledPromise } = message;
              const { promise } = decoupledPromise;
              return promise.cancel(reason).catch((error) => {
                reportProgress(percentage, error);
                return error;
              });
            })
          );
          onCancel(() => {
            resultsPromise.cancel();
          });
          resolve(resultsPromise.then(() => {
          }));
        }
      );
    }
    addMessageToQueue(message) {
      this.messagesQueue.set(message.messageId, message);
    }
    /**
     * Send a message to the worker queue to an specific method
     * @template TResult_ - result type of the message (if any)
     * @template TPayload_ - payload type of the message  (if any)
     * @param {string} method - method name
     * @param {TPayload} payload - whatever json data you want to send to the worker
     * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
     */
    sendToMethod(method, payload, transfer) {
      return this.sendToWorker(
        { method, payload },
        transfer
      );
    }
    /**
     * This method will reboot the worker and cancel all the messages in the queue
     * @param {unknown} reason - reason why the worker will be restarted
     */
    reboot(reason = "Worker was rebooted") {
      if (!this.workerUrl) {
        throw new Error(
          "You can not reboot a worker that was created from a Worker Instance"
        );
      }
      this.workers.forEach((worker) => worker.terminate());
      this.workers = [];
      const resolutionPromises = this.cancelAll(reason);
      this.warmUp();
      return resolutionPromises;
    }
    /**
     * This method will remove the WebWorker and the BlobUrl
     */
    async dispose() {
      await this.cancelAll(null);
      if (this.workerUrl) {
        (window.URL || window.webkitURL).revokeObjectURL(
          typeof this.workerUrl === "string" ? this.workerUrl : this.workerUrl.href
        );
      }
      this.workers.forEach((worker) => worker.terminate());
      this.workers = [];
    }
  };

  // src/StaticEasyWebWorker.ts
  var StaticEasyWebWorker = function(onMessageCallback) {
    const { close, onMessage, importScripts } = (() => {
      const workerMessages = /* @__PURE__ */ new Map();
      const workerCallbacks = /* @__PURE__ */ new Map([
        [
          "",
          () => {
            throw "you didn't defined a message-callback, please assign a callback by calling easyWorker.onMessage";
          }
        ]
      ]);
      const createMessage = ({
        messageId,
        payload,
        method
      }) => {
        let messageStatus = "pending";
        const messageCallbacks = /* @__PURE__ */ new Map();
        const postMessage = (messageType, messageData, transfer = []) => {
          const currentMessageStatus = messageStatus;
          const targetMessageStatus = messageType === "progress" ? "pending" : messageType;
          if (!workerMessages.has(messageId)) {
            const message = "%c#" + messageId + " Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To now more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";
            console.error(
              message,
              "color: darkorange; font-size: 12px; font-weight: bold;",
              "font-weight: normal;",
              "font-weight: bold;",
              "font-weight: normal;",
              "color: lightblue; font-size: 10px; font-weight: bold;",
              "font-weight: bold; color: darkorange;",
              {
                messageId,
                status: {
                  current: currentMessageStatus,
                  target: targetMessageStatus
                },
                method,
                action: messageData
              }
            );
            return;
          }
          const callbacksKey = {
            resolved: "onResolve",
            rejected: "onReject",
            /**
             * Cancelation could be triggered by the worker or by the main thread
             * */
            canceled: "onCancel",
            worker_cancelation: "onCancel",
            pending: "onProgress"
          }[targetMessageStatus];
          const targetCallbacks = messageCallbacks.get(callbacksKey);
          const isMessageTermination = !messageData.progress;
          try {
            targetCallbacks?.forEach(
              (callback) => callback(messageData, transfer)
            );
            if (isMessageTermination) {
              messageCallbacks.get("onFinalize")?.forEach((callback) => callback(messageData, transfer));
            }
          } catch (error) {
            workerMessages.delete(messageId);
            throw {
              message: "Error while processing message id: " + messageId,
              error,
              messageData,
              messageType,
              when: callbacksKey
            };
          } finally {
            if (isMessageTermination) {
              workerMessages.delete(messageId);
            }
          }
          self.postMessage({ messageId, ...messageData }, transfer);
          messageStatus = targetMessageStatus;
        };
        const getStatus = () => messageStatus;
        const isPending = () => messageStatus === "pending";
        const resolve = (result, transfer = []) => postMessage(
          "resolved",
          { resolved: { payload: result === void 0 ? [] : [result] } },
          transfer
        );
        const reject = (reason, transfer = []) => {
          postMessage("rejected", { rejected: { reason } }, transfer);
        };
        const cancel = (reason, transfer = []) => postMessage(
          "worker_cancelation",
          { worker_cancelation: { reason } },
          transfer
        );
        const reportProgress = (percentage, payload2, transfer = []) => {
          postMessage(
            "progress",
            { progress: { percentage, payload: payload2 } },
            transfer
          );
        };
        const createSubscription = (type) => (callback) => {
          if (!messageCallbacks.has(type)) {
            messageCallbacks.set(type, /* @__PURE__ */ new Set());
          }
          const callbacks = messageCallbacks.get(type);
          callbacks.add(callback);
          return () => callbacks.delete(callback);
        };
        return {
          messageId,
          method,
          payload,
          getStatus,
          isPending,
          /**
           * Actions
           */
          resolve,
          reject,
          cancel,
          reportProgress,
          /**
           * Callbacks
           */
          onResolve: createSubscription("onResolve"),
          onReject: createSubscription("onReject"),
          onCancel: createSubscription("onCancel"),
          onProgress: createSubscription("onProgress"),
          onFinalize: createSubscription("onFinalize")
        };
      };
      const onMessage2 = (...args) => {
        const [param1, param2] = args;
        const hasCustomCallbackKey = typeof param1 === "string";
        if (hasCustomCallbackKey) {
          const callbackKey = param1;
          const callback2 = param2;
          workerCallbacks.set(callbackKey, callback2);
          return;
        }
        const callback = param1;
        workerCallbacks.set("", callback);
      };
      const close2 = () => {
        const messages = [...workerMessages.values()];
        messages.forEach((message) => message.reject(new Error("worker closed")));
        self.close();
      };
      self.onmessage = (event) => {
        const messageId = event?.data?.messageId;
        const __is_easy_web_worker_message__ = event?.data?.__is_easy_web_worker_message__ ?? false;
        const isEasyWebWorkerMessage = messageId && __is_easy_web_worker_message__;
        if (!isEasyWebWorkerMessage) return;
        try {
          const { data } = event;
          const { cancelation } = data;
          if (cancelation) {
            const { reason } = cancelation;
            const message2 = workerMessages.get(messageId);
            message2?.cancel(reason);
            return;
          }
          const { method, execution } = event.data;
          const { payload } = execution;
          const message = createMessage({
            method,
            messageId,
            payload
          });
          workerMessages.set(messageId, message);
          const callback = workerCallbacks.get(method || "");
          callback(message, event);
        } catch (error) {
          workerMessages.delete(event.data?.messageId);
          throw {
            message: "Error while processing message id: " + messageId,
            event
          };
        }
      };
      const importScripts2 = (...scripts) => {
        self.importScripts(...scripts);
      };
      return {
        onMessage: onMessage2,
        close: close2,
        importScripts: importScripts2
      };
    })();
    this.close = close;
    this.onMessage = onMessage;
    this.importScripts = importScripts;
    if (onMessageCallback) {
      onMessage(onMessageCallback);
    }
  };

  // src/createEasyWebWorker.ts
  var createEasyWebWorker = (source, parameters = {}) => {
    return new EasyWebWorker(source, parameters);
  };

  // src/createStaticEasyWebWorker.ts
  var createStaticEasyWebWorker = (onMessageCallback) => {
    const worker = new StaticEasyWebWorker(onMessageCallback);
    return worker;
  };

  // e2e/harness/main.ts
  var wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  var settle = (promise) => Promise.resolve(promise).then(
    (value) => ({ status: "resolved", value }),
    (reason) => ({ status: "rejected", reason })
  );
  var settleWithin = (promise, milliseconds) => Promise.race([
    settle(promise),
    wait(milliseconds).then(() => ({ status: "timeout" }))
  ]);
  var describeError = (error) => {
    if (error instanceof Error) {
      return { isError: true, name: error.name, message: error.message };
    }
    return { isError: false, value: error };
  };
  var e2e = {
    wait,
    settle,
    settleWithin,
    describeError,
    staticWorkerUrl: `${location.origin}/static.worker.js`,
    scriptUrl: (name) => `${location.origin}/scripts/${name}.js`
  };
  Object.assign(window, { easyWebWorker: src_exports, e2e });
})();
