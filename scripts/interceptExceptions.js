// THIS SCRIPT IS VIBECODED!
// Frida script to intercept IL2CPP exceptions with managed stack traces
// Usage: frida -U -f <package_name> -l interceptExceptions.js --no-pause
//   or:  frida -U <package_name> -l interceptExceptions.js

"use strict";

function hookExceptions() {
    var moduleName = "libil2cpp.so";
    var il2cpp = Process.findModuleByName(moduleName);
    if (!il2cpp) {
        console.log("[!] libil2cpp.so not found yet, retrying...");
        setTimeout(hookExceptions, 1000);
        return;
    }

    console.log("[*] libil2cpp.so base: " + il2cpp.base);
    var ptrSize = Process.pointerSize;

    // ---- Resolve IL2CPP API functions for method name resolution ----
    function findExport(name) {
        return il2cpp.findExportByName(name);
    }

    // Method info APIs - these are safe read-only functions
    var _il2cpp_method_get_name = (function() {
        var a = findExport("il2cpp_method_get_name");
        return a ? new NativeFunction(a, 'pointer', ['pointer']) : null;
    })();
    var _il2cpp_method_get_class = (function() {
        var a = findExport("il2cpp_method_get_class");
        return a ? new NativeFunction(a, 'pointer', ['pointer']) : null;
    })();
    var _il2cpp_class_get_name = (function() {
        var a = findExport("il2cpp_class_get_name");
        return a ? new NativeFunction(a, 'pointer', ['pointer']) : null;
    })();
    var _il2cpp_class_get_namespace = (function() {
        var a = findExport("il2cpp_class_get_namespace");
        return a ? new NativeFunction(a, 'pointer', ['pointer']) : null;
    })();

    console.log("[*] IL2CPP API: method_get_name=" + (!!_il2cpp_method_get_name) +
        " method_get_class=" + (!!_il2cpp_method_get_class) +
        " class_get_name=" + (!!_il2cpp_class_get_name) +
        " class_get_namespace=" + (!!_il2cpp_class_get_namespace));

    // Helper: read a C# System.String (Il2CppString) from a pointer
    function readIl2CppString(strPtr) {
        if (strPtr.isNull()) return "<null>";
        try {
            var length = strPtr.add(ptrSize * 2).readS32();
            if (length <= 0 || length > 65536) return "<invalid string len=" + length + ">";
            var strData = strPtr.add(ptrSize * 2 + 4);
            return strData.readUtf16String(length);
        } catch (e) {
            return "<error: " + e + ">";
        }
    }

    function tryReadStringField(objPtr, offset) {
        try {
            var fieldPtr = objPtr.add(offset).readPointer();
            if (fieldPtr.isNull()) return null;
            if (fieldPtr.compare(ptr(0x1000)) < 0) return null;
            var result = readIl2CppString(fieldPtr);
            if (result.startsWith("<")) return null;
            return result;
        } catch(e) {
            return null;
        }
    }

    // Get method description from MethodInfo pointer (safe, read-only)
    function getMethodDescription(methodInfo) {
        if (!methodInfo || methodInfo.isNull()) return null;
        try {
            var parts = [];

            if (_il2cpp_method_get_class && _il2cpp_class_get_name) {
                var klass = _il2cpp_method_get_class(methodInfo);
                if (!klass.isNull()) {
                    if (_il2cpp_class_get_namespace) {
                        var nsPtr = _il2cpp_class_get_namespace(klass);
                        if (!nsPtr.isNull()) {
                            var ns = nsPtr.readUtf8String();
                            if (ns && ns.length > 0) parts.push(ns);
                        }
                    }
                    var classNamePtr = _il2cpp_class_get_name(klass);
                    if (!classNamePtr.isNull()) {
                        parts.push(classNamePtr.readUtf8String());
                    }
                }
            }

            if (_il2cpp_method_get_name) {
                var namePtr = _il2cpp_method_get_name(methodInfo);
                if (!namePtr.isNull()) {
                    var methodName = namePtr.readUtf8String();
                    return (parts.length > 0 ? parts.join(".") + "." : "") + methodName + "()";
                }
            }

            return parts.length > 0 ? parts.join(".") : null;
        } catch(e) {
            return null;
        }
    }

    // Resolve a native address in libil2cpp.so to a method name if possible
    // by scanning nearby memory for MethodInfo pointers
    function resolveIl2cppAddress(addr) {
        var sym = DebugSymbol.fromAddress(addr);
        var symStr = sym.toString();

        // If it already has a symbol name (not just module+offset), use it
        if (sym.name && sym.name.length > 0 && sym.name !== sym.moduleName) {
            return symStr;
        }

        return symStr;
    }

    function logException(label, exPtr) {
        console.log("\n" + label);

        // Read exception type name directly from memory
        try {
            var klassPtr = exPtr.readPointer();
            if (!klassPtr.isNull() && klassPtr.compare(ptr(0x1000)) > 0) {
                // Use IL2CPP API if available (safe read-only calls)
                if (_il2cpp_class_get_name && _il2cpp_class_get_namespace) {
                    try {
                        var nsPtr = _il2cpp_class_get_namespace(klassPtr);
                        var namePtr = _il2cpp_class_get_name(klassPtr);
                        var ns = (!nsPtr.isNull()) ? nsPtr.readUtf8String() : "";
                        var name = (!namePtr.isNull()) ? namePtr.readUtf8String() : "?";
                        console.log("  Type: " + (ns && ns.length > 0 ? ns + "." : "") + name);
                    } catch(e) {
                        // Fallback: read from klass struct directly
                        var namePtr2 = klassPtr.add(0x10).readPointer();
                        if (!namePtr2.isNull() && namePtr2.compare(ptr(0x1000)) > 0) {
                            console.log("  Type: " + namePtr2.readUtf8String());
                        }
                    }
                } else {
                    var namePtr3 = klassPtr.add(0x10).readPointer();
                    if (!namePtr3.isNull() && namePtr3.compare(ptr(0x1000)) > 0) {
                        console.log("  Type: " + namePtr3.readUtf8String());
                    }
                }
            }
        } catch(e) {}

        // Try to read _message
        var headerSize = ptrSize * 2;
        var message = tryReadStringField(exPtr, headerSize + ptrSize * 1);
        if (!message) message = tryReadStringField(exPtr, headerSize + ptrSize * 2);
        if (message) {
            console.log("  Message: " + message);
        }

        // Scan exception object for _stackTraceString and other string fields
        for (var i = 3; i < 12; i++) {
            try {
                var offset = headerSize + ptrSize * i;
                var str = tryReadStringField(exPtr, offset);
                if (str && str.length > 0 && str !== message) {
                    if (str.indexOf(" at ") !== -1 || (str.indexOf("(") !== -1 && str.indexOf(".") !== -1 && str.length > 40)) {
                        console.log("  Managed Stack Trace:");
                        console.log("  " + str.replace(/\n/g, '\n  '));
                    } else {
                        console.log("  Field[" + i + "]: " + str);
                    }
                }
            } catch(e) {}
        }
    }

    // Hook il2cpp_raise_exception
    var raiseExceptionAddr = il2cpp.findExportByName("il2cpp_raise_exception");
    if (raiseExceptionAddr) {
        console.log("[*] il2cpp_raise_exception at: " + raiseExceptionAddr);

        try {
            Interceptor.attach(raiseExceptionAddr, {
                onEnter: function(args) {
                    try {
                        var ex = ptr(args[0]);
                        logException("🔴🔴🔴 EXCEPTION RAISED:", ex);

                        // Native backtrace
                        try {
                            console.log("  Native backtrace:");
                            var bt = Thread.backtrace(this.context, Backtracer.FUZZY);
                            for (var i = 0; i < bt.length; i++) {
                                console.log("    " + resolveIl2cppAddress(bt[i]));
                            }
                        } catch(bt) {
                            console.log("  (native backtrace unavailable)");
                        }
                    } catch(e) {
                        console.log("[!] Error in hook: " + e);
                    }
                }
            });
            console.log("[+] Hooked via Interceptor.attach!");
        } catch (e) {
            console.log("[!] Interceptor.attach failed: " + e);
            console.log("[*] Trying inline hook...");

            try {
                var trampolineSize = 256;
                var trampoline = Memory.alloc(trampolineSize);

                var logCallbackPtr = new NativeCallback(function(exPtr) {
                    try {
                        logException("🔴🔴🔴 EXCEPTION RAISED:", exPtr);
                    } catch(err) {
                        console.log("[!] Logger error: " + err);
                    }
                }, 'void', ['pointer']);

                Memory.patchCode(trampoline, trampolineSize, function(code) {
                    var writer = new Arm64Writer(code, { pc: trampoline });
                    writer.putPushRegReg('x0', 'x30');
                    writer.putLdrRegAddress('x16', logCallbackPtr);
                    writer.putBlrReg('x16');
                    writer.putPopRegReg('x0', 'x30');
                    writer.putBytes(raiseExceptionAddr.readByteArray(4));
                    writer.putLdrRegAddress('x16', raiseExceptionAddr.add(4));
                    writer.putBrReg('x16');
                    writer.flush();
                });

                Memory.patchCode(raiseExceptionAddr, 16, function(code) {
                    var writer = new Arm64Writer(code, { pc: raiseExceptionAddr });
                    writer.putLdrRegAddress('x16', trampoline);
                    writer.putBrReg('x16');
                    writer.flush();
                });

                hookExceptions._trampoline = trampoline;
                hookExceptions._logCallback = logCallbackPtr;

                console.log("[+] Hooked via manual inline patch!");
            } catch(e2) {
                console.log("[!] Manual hook also failed: " + e2);
            }
        }
    } else {
        console.log("[!] il2cpp_raise_exception export not found");
    }

    console.log("[+] Exception hooks installed!");
}

// Start hooking
setTimeout(hookExceptions, 0);
