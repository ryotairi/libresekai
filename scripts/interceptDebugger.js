// THIS SCRIPT IS VIBECODED!
// Frida script to intercept UnityEngine.Debug log functions (IL2CPP)
// Usage: frida -U -f <package_name> -l frida_debug_hook.js --no-pause
//   or:  frida -U <package_name> -l frida_debug_hook.js

"use strict";

// Wait for the IL2CPP module to load
function hookDebug() {
    const moduleName = "libil2cpp.so";
    const il2cpp = Process.findModuleByName(moduleName);
    if (!il2cpp) {
        console.log("[!] libil2cpp.so not found yet, retrying...");
        setTimeout(hookDebug, 1000);
        return;
    }

    const base = il2cpp.base;
    console.log("[*] libil2cpp.so base: " + base);

    // RVA addresses from the IL2CPP dump
    const offsets = {
        // Log functions
        "Debug.Log(object)":                        0x9B3A76C,
        "Debug.Log(object, object)":                0x9B3A874,
        "Debug.LogFormat(string, object[])":        0x9B3A98C,
        "Debug.LogFormat(LogType, ...)":            0x9B3AAA4,
        "Debug.LogError(object)":                   0x9B3AD7C,
        "Debug.LogError(object, object)":           0x9B3AE84,
        "Debug.LogErrorFormat(string, object[])":   0x9B3AF9C,
        "Debug.LogErrorFormat(object, string, object[])": 0x9B3B0B4,
        "Debug.LogWarning(object)":                 0x9B3B2E4,
        "Debug.LogWarning(object, object)":         0x9B3B3EC,
        "Debug.LogWarningFormat(string, object[])": 0x9B3B504,
        "Debug.LogWarningFormat(object, string, object[])": 0x9B3B61C,
        "Debug.LogException(Exception)":            0x9B3641C,
        "Debug.LogException(Exception, object)":    0x9B3B1D0,
        "Debug.LogAssertion(object)":               0x9B3B984,
        "Debug.LogAssertionFormat(string, object[])": 0x9B3BA8C,
        "Debug.Assert(bool)":                       0x9B3B738,
        "Debug.Assert(bool, string)":               0x9B3B868,

        // IsLoggingEnabled - we want this to always return true
        "Debug.IsLoggingEnabled()":                 0x9B3BFC4,
    };

    // Helper: read a C# System.String (Il2CppString) from a pointer
    // IL2CPP string layout: [Il2CppObject header (2 ptrs)] [int length] [char16 data...]
    function readIl2CppString(ptr) {
        if (ptr.isNull()) return "<null>";
        try {
            const ptrSize = Process.pointerSize;
            // length is at offset 2*pointerSize (after klass + monitor)
            const length = ptr.add(ptrSize * 2).readS32();
            if (length <= 0 || length > 65536) return "<invalid string len=" + length + ">";
            // char data starts at offset 2*pointerSize + 4
            const strData = ptr.add(ptrSize * 2 + 4);
            return strData.readUtf16String(length);
        } catch (e) {
            return "<error reading string: " + e + ">";
        }
    }

    // Helper: try to read an IL2CPP object's ToString (best-effort via string read)
    // For log calls, the first arg is typically an Il2CppString or a boxed object.
    // We'll try reading it as a string first; if that fails, just show the pointer.
    function readMessageArg(ptr) {
        if (ptr.isNull()) return "<null>";
        try {
            // Try reading as Il2CppString
            const s = readIl2CppString(ptr);
            if (s && !s.startsWith("<error") && !s.startsWith("<invalid")) {
                return s;
            }
        } catch (e) {}
        return "<object@" + ptr + ">";
    }

    // ---- Hook IsLoggingEnabled to always return true ----
    const isLoggingEnabledAddr = base.add(offsets["Debug.IsLoggingEnabled()"]);
    console.log("[*] Hooking Debug.IsLoggingEnabled at " + isLoggingEnabledAddr);
    Interceptor.attach(isLoggingEnabledAddr, {
        onLeave: function (retval) {
            retval.replace(ptr(1)); // return true
        }
    });
    console.log("[+] Debug.IsLoggingEnabled will now always return true");

    // ---- Hook log functions ----

    // Debug.Log(object message)
    Interceptor.attach(base.add(offsets["Debug.Log(object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[LOG] " + msg);
        }
    });

    // Debug.Log(object message, object context)
    Interceptor.attach(base.add(offsets["Debug.Log(object, object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[LOG] " + msg);
        }
    });

    // Debug.LogFormat(string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogFormat(string, object[])"]), {
        onEnter: function (args) {
            const fmt = readIl2CppString(args[0]);
            console.log("[LOG:Format] " + fmt);
        }
    });

    // Debug.LogFormat(LogType, LogOption, object context, string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogFormat(LogType, ...)"]), {
        onEnter: function (args) {
            // args[0] = LogType (int), args[1] = LogOption (int), args[2] = context, args[3] = format string, args[4] = args array
            const logType = args[0].toInt32();
            const fmt = readIl2CppString(args[3]);
            const logTypeNames = ["Error", "Assert", "Warning", "Log", "Exception"];
            const typeName = logTypeNames[logType] || ("Type" + logType);
            console.log("[LOG:Format:" + typeName + "] " + fmt);
        }
    });

    // Debug.LogError(object message)
    Interceptor.attach(base.add(offsets["Debug.LogError(object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[ERROR] " + msg);
        }
    });

    // Debug.LogError(object message, object context)
    Interceptor.attach(base.add(offsets["Debug.LogError(object, object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[ERROR] " + msg);
        }
    });

    // Debug.LogErrorFormat(string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogErrorFormat(string, object[])"]), {
        onEnter: function (args) {
            const fmt = readIl2CppString(args[0]);
            console.log("[ERROR:Format] " + fmt);
        }
    });

    // Debug.LogErrorFormat(object context, string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogErrorFormat(object, string, object[])"]), {
        onEnter: function (args) {
            const fmt = readIl2CppString(args[1]);
            console.log("[ERROR:Format] " + fmt);
        }
    });

    // Debug.LogWarning(object message)
    Interceptor.attach(base.add(offsets["Debug.LogWarning(object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[WARNING] " + msg);
        }
    });

    // Debug.LogWarning(object message, object context)
    Interceptor.attach(base.add(offsets["Debug.LogWarning(object, object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[WARNING] " + msg);
        }
    });

    // Debug.LogWarningFormat(string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogWarningFormat(string, object[])"]), {
        onEnter: function (args) {
            const fmt = readIl2CppString(args[0]);
            console.log("[WARNING:Format] " + fmt);
        }
    });

    // Debug.LogWarningFormat(object context, string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogWarningFormat(object, string, object[])"]), {
        onEnter: function (args) {
            const fmt = readIl2CppString(args[1]);
            console.log("[WARNING:Format] " + fmt);
        }
    });

    // Debug.LogException(Exception exception)
    Interceptor.attach(base.add(offsets["Debug.LogException(Exception)"]), {
        onEnter: function (args) {
            // Exception objects are complex; try reading the _message field
            // Il2CppObject header (2 ptrs), then fields depend on class layout.
            // System.Exception._message is typically at a known offset. We'll try a common one.
            const excPtr = args[0];
            if (!excPtr.isNull()) {
                try {
                    const ptrSize = Process.pointerSize;
                    // Common offset for _message in System.Exception: 0x10 (arm64) or 0x8 (arm32) after header
                    // Header is 2*ptrSize. _className is first field, _message is second.
                    // Typical layout: klass, monitor, _className, _message, ...
                    // Try offset 2*ptrSize + ptrSize = 3*ptrSize for _message (skip _className)
                    const msgPtr = excPtr.add(ptrSize * 2 + ptrSize).readPointer();
                    const msg = readIl2CppString(msgPtr);
                    console.log("[EXCEPTION] " + msg);
                } catch (e) {
                    console.log("[EXCEPTION] <could not read message: " + e + "> ptr=" + excPtr);
                }
            } else {
                console.log("[EXCEPTION] <null>");
            }
        }
    });

    // Debug.LogException(Exception exception, object context)
    Interceptor.attach(base.add(offsets["Debug.LogException(Exception, object)"]), {
        onEnter: function (args) {
            const excPtr = args[0];
            if (!excPtr.isNull()) {
                try {
                    const ptrSize = Process.pointerSize;
                    const msgPtr = excPtr.add(ptrSize * 2 + ptrSize).readPointer();
                    const msg = readIl2CppString(msgPtr);
                    console.log("[EXCEPTION] " + msg);
                } catch (e) {
                    console.log("[EXCEPTION] <could not read message: " + e + "> ptr=" + excPtr);
                }
            } else {
                console.log("[EXCEPTION] <null>");
            }
        }
    });

    // Debug.LogAssertion(object message)
    Interceptor.attach(base.add(offsets["Debug.LogAssertion(object)"]), {
        onEnter: function (args) {
            const msg = readMessageArg(args[0]);
            console.log("[ASSERTION] " + msg);
        }
    });

    // Debug.LogAssertionFormat(string format, object[] args)
    Interceptor.attach(base.add(offsets["Debug.LogAssertionFormat(string, object[])"]), {
        onEnter: function (args) {
            const fmt = readIl2CppString(args[0]);
            console.log("[ASSERTION:Format] " + fmt);
        }
    });

    // Debug.Assert(bool condition)
    Interceptor.attach(base.add(offsets["Debug.Assert(bool)"]), {
        onEnter: function (args) {
            const cond = args[0].toInt32();
            if (!cond) {
                console.log("[ASSERT FAILED] condition=false");
            }
        }
    });

    // Debug.Assert(bool condition, string message)
    Interceptor.attach(base.add(offsets["Debug.Assert(bool, string)"]), {
        onEnter: function (args) {
            const cond = args[0].toInt32();
            if (!cond) {
                const msg = readIl2CppString(args[1]);
                console.log("[ASSERT FAILED] " + msg);
            }
        }
    });

    console.log("[+] All Debug log hooks installed successfully!");
    console.log("[*] Listening for Unity Debug log calls...");
}

// Start hooking
setTimeout(hookDebug, 0);
