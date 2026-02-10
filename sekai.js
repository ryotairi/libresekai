function startHooking() {
    const moduleName = "libil2cpp.so";
    const common = Process.findModuleByName(moduleName);

    if (common) {
        console.log("[+] Found libil2cpp.so at: " + common.base);
        const baseAddr = common.base;
        
        // --- ТВОЙ КОД ТУТ ---
        
        const fastDecryptAddr = baseAddr.add(ptr("0x4F59074"));
        const fastConstructorAddr = baseAddr.add(ptr("0x4F58798"));

        // Пример хука на конструктор для ключей
        Interceptor.attach(fastConstructorAddr, {
            onEnter: function (args) {
                console.log("\n--- [FastAESCrypt Instance Created] ---");
                dumpArray("KEY", args[1]);
                dumpArray("IV ", args[2]);
            }
        });
        
        // --- КОНЕЦ ТВОЕГО КОДА ---

    } else {
        // Если модуль еще не найден, пробуем снова через 500мс
        setTimeout(startHooking, 500);
    }
}

function dumpArray(label, addr) {
    if (addr.isNull()) return;
    const len = addr.add(24).readS32();
    const data = addr.add(32).readByteArray(len);
    console.log(label + " (" + len + " bytes): " + 
        Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join(''));
}

// Запускаем процесс ожидания
startHooking();