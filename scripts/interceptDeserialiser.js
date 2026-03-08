Java.perform(function() {
    // Подключаемся к il2cpp
    var il2cpp = Process.getModuleByName("libil2cpp.so");

    // Находим адрес метода по токену 0x600205C
    // Токен = RVA в metadata, нужно найти реальный адрес
    var methodAddress = il2cpp.base.add(0x600205C); // Замени на реальный RVA из дампа

    Interceptor.attach(methodAddress, {
        onEnter: function(args) {
            console.log("\n=== Deserialize called ===");

            // args[0] = this (если не статик, иначе пропускаем)
            // args[1] = byte[] bytes
            // args[2] = int offset
            // args[3] = IFormatterResolver resolver
            // args[4] = out int readSize

            var bytesPtr = ptr(args[1]);
            var offset = args[2].toInt32();

            console.log("Offset: " + offset);

            // Читаем byte array (первые 100 байт для примера)
            try {
                var arrayLength = Memory.readU32(bytesPtr.add(0x18)); // IL2CPP array length offset
                var dataPtr = bytesPtr.add(0x20); // IL2CPP array data offset

                console.log("Array length: " + arrayLength);
                console.log("Bytes (hex): " + hexdump(dataPtr.add(offset), {
                    length: Math.min(100, arrayLength - offset),
                    header: false
                }));
            } catch(e) {
                console.log("Error reading bytes: " + e);
            }

            // Сохраняем указатель на out параметр
            this.readSizePtr = args[4];
        },

        onLeave: function(retval) {
            console.log("\n=== Deserialize result ===");

            // Результат
            console.log("Return value ptr: " + retval);

            // Читаем out int readSize
            try {
                var readSize = Memory.readS32(this.readSizePtr);
                console.log("Read size: " + readSize);
            } catch(e) {
                console.log("Error reading readSize: " + e);
            }

            // Пытаемся прочитать результат (если это объект)
            if (!retval.isNull()) {
                try {
                    // Читаем тип объекта
                    var klassPtr = Memory.readPointer(retval);
                    var namePtr = Memory.readPointer(klassPtr.add(0x10)); // offset к имени класса
                    var className = Memory.readUtf8String(namePtr);
                    console.log("Result type: " + className);
                } catch(e) {
                    console.log("Error reading result type: " + e);
                }
            } else {
                console.log("Result is null");
            }

            console.log("========================\n");
        }
    });

    console.log("Deserialize hook installed!");
});
