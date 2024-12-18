// index.js
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";

const token = "7335741883:AAF6DupO7HyWWjuIrRGn_FIgEG1V8kWkWdc" ;
const bot = new TelegramBot(token, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

const dataFile = "./data.json";
let data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));

// Asosiy menyu
const mainMenu = {
  reply_markup: {
    keyboard: [
      ["Qo'shilgan setlar"],
      ["Set qo'shish", "Setni tahrirlash"],
      ["Setni o'chirish"],
    ],
    resize_keyboard: true,
  },
};
const restart = {
  reply_markup: {
    keyboard: [
      ["/start"]
    ],
    resize_keyboard: true,
  },
};

// Admin login qilish
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Salom",
    mainMenu
  );
});

bot.on("message", (msg) => {
  if (msg.chat.id == 1184089793) {
      switch (msg.text) {
        case "Qo'shilgan setlar":
          return showBrands(msg.chat.id);
        case "Set qo'shish":
          return addSetStart(msg.chat.id);
        case "Setni tahrirlash":
          return editSetStart(msg.chat.id);
        case "Setni o'chirish":
          return deleteSetStart(msg.chat.id);
        default:
          bot.sendMessage(msg.chat.id, mainMenu);
      }
  }
});

// Qo'shilgan setlar funksiyasi
function showBrands(chatId) {
  const brands = data.brends.map((br) => br.name); // Faqat brendlardan tugmalar yaratamiz.

  bot.sendMessage(chatId, "Brendni tanlang:", {
    reply_markup: {
      keyboard: brands.map((br) => [br]).concat([["Asosiy menyu"]]),
      resize_keyboard: true,
    },
  });

  // Brendni tanlashni kutamiz
  bot.once("message", (brandMsg) => {
    if (brands.includes(brandMsg.text)) {
      const selectedBrand = brandMsg.text; // Tanlangan brend
      const sets = data.products.filter(
        (product) => product.brend === selectedBrand
      ); // Ushbu brend uchun setlarni qidiramiz

      if (sets.length > 0) {
        const setList = sets
          .map((set) => `ID: ${set.id}, Nom: ${set.car}`)
          .join("\n"); // Setlar ro‘yxatini tuzamiz
        bot.sendMessage(
          chatId,
          `Brend: ${selectedBrand}\nMavjud setlar:\n${setList}\nSet ID ni kiriting, batafsil ma'lumot olish uchun:`,
          {
            reply_markup: {
              remove_keyboard: true,
            },
          }
        );

        // Set ID tanlashni kutamiz
        bot.once("message", (setMsg) => {
          const selectedSet = sets.find((set) => set.id === setMsg.text); // ID bo‘yicha setni topamiz
          if (selectedSet) {
            // Set haqida to‘liq ma'lumot
            const setDetails = `
Полная информация о наборе:
ID: ${selectedSet.id}
Марка: ${selectedSet.brend}
Имя машины: ${selectedSet.car}
Название коллекции: ${selectedSet.collection || "Noma'lum"}
Редуктор: ${selectedSet.reduktor || "Noma'lum"}
Форсунка: ${selectedSet.forsunka || "Noma'lum"}
Электроника: ${selectedSet.injektor || "Noma'lum"}
Тип Баллона: ${selectedSet.ballon || "Noma'lum"}
мультиклапаны: ${selectedSet.multiklapan || "Noma'lum"}
Филтры: ${selectedSet.filter || "Noma'lum"}
Дополнительная информация: ${selectedSet.extra || "Noma'lum"}
            `;
            bot.sendMessage(chatId, setDetails, mainMenu);
          } else {
            bot.sendMessage(chatId, "Set ID noto‘g‘ri kiritildi.", mainMenu);
          }
        });
      } else {
        bot.sendMessage(
          chatId,
          `Brend: ${selectedBrand} uchun setlar mavjud emas.`,
          mainMenu
        );
      }
    } else if (brandMsg.text === "Asosiy menyu") {
      bot.sendMessage(chatId, "Asosiy menyuga qaytdingiz.", mainMenu);
    } else {
      bot.sendMessage(
        chatId,
        "Brend noto'g'ri tanlangan. Iltimos, qayta urinib ko‘ring.",
        mainMenu
      );
    }
  });
}

// Set qo'shish funksiyasi
function addSetStart(chatId) {
  const brands = data.brends.map((br) => br.name);
  bot.sendMessage(chatId, "Qaysi brendga set qo'shmoqchisiz?", {
    reply_markup: {
      keyboard: brands.map((br) => [br]).concat([["Asosiy menyu"]]),
      resize_keyboard: true,
    },
  });

  bot.once("message", (brandMsg) => {
    if (brands.includes(brandMsg.text)) {
      const selectedBrand = brandMsg.text;
      const newSet = { brend: selectedBrand }; // Yangi set boshlanmoqda
      askForDetails(chatId, newSet);
    } else if (brandMsg.text === "Asosiy menyu") {
      bot.sendMessage(chatId, "Asosiy menyuga qaytdingiz.", mainMenu);
    } else {
      bot.sendMessage(
        chatId,
        "Brend noto'g'ri tanlangan. Iltimos, qayta urinib ko‘ring.",
        mainMenu
      );
    }
  });
}

// Detallar uchun yordamchi funksiya
function askForDetails(chatId, set, step = 0) {
  const questions = [
    "Имя машины:",
    "Название коллекции:",
    "Редуктор:",
    "Форсунка",
    "Электроника",
    "Тип Баллона",
    "мультиклапаны",
    "Филтры",
    "Дополнительная информация:(Пастафка,кран для газового баллона,Запрашный,Фитинг,Шлангы)",
  ];

  bot.sendMessage(chatId, questions[step]);

  bot.once("message", (msg) => {
    const answers = [
      "car",
      "collection",
      "reduktor",
      "forsunka",
      "injektor",
      "ballon",
      "multiklapan",
      "filter",
      "extra",
    ];

    // Javobni setga yozamiz
    set[answers[step]] = msg.text;

    // Keyingi savolga o‘tamiz yoki setni saqlaymiz
    if (step < questions.length - 1) {
      askForDetails(chatId, set, step + 1);
    } else {
      // Setni yakunlash va ma'lumotlarni saqlash
      set.id = (data.products.length + 1).toString();
      data.products.push(set);
      saveDataToFile();
      bot.sendMessage(
        chatId,
        `Set muvaffaqiyatli qo\'shildi:\nID: ${set.id}, Nom: ${set.car}\nKolleksiya: ${set.collection}`,
        restart
      );
    }
  });
}

// Setni tahrirlash funksiyasi
function editSetStart(chatId) {
  // Set ID ni so‘rash
  bot.sendMessage(chatId, "Tahrirlash uchun setning ID raqamini kiriting:");

  bot.once("message", (idMsg) => {
    const setId = idMsg.text;
    const setToEdit = data.products.find((set) => set.id === setId);

    if (setToEdit) {
      // Tanlangan setni ko‘rsatish
      const setDetails = `
Setni tahrirlash uchun mavjud ma'lumotlar:
ID: ${setToEdit.id}
Brend: ${setToEdit.brend}
Nom: ${setToEdit.car}
Kolleksiya: ${setToEdit.collection || 'Noma\'lum'}
Reduktor: ${setToEdit.reduktor || 'Noma\'lum'}
Forsunka: ${setToEdit.forsunka || 'Noma\'lum'}
Inyektor: ${setToEdit.injektor || 'Noma\'lum'}
Ballon: ${setToEdit.ballon || 'Noma\'lum'}
Multiklapan: ${setToEdit.multiklapan || 'Noma\'lum'}
Filtr: ${setToEdit.filter || 'Noma\'lum'}
Qo‘shimcha ma'lumot: ${setToEdit.extra || 'Noma\'lum'}

Tahrir qilmoqchi bo‘lgan maydon nomini kiriting (masalan: brend, car, collection va hokazo). Asosiy menyuga qaytish uchun "Asosiy menyu"ni tanlang.
      `;
      bot.sendMessage(chatId, setDetails);

      // Tahrir qilmoqchi bo‘lgan maydonni tanlash
      bot.once("message", (fieldMsg) => {
        const fieldToEdit = fieldMsg.text.toLowerCase();

        // Asosiy menyuga qaytish
        if (fieldToEdit === "asosiy menyu") {
          bot.sendMessage(chatId, "Asosiy menyuga qaytdingiz.", mainMenu);
          return;
        }

        if (setToEdit.hasOwnProperty(fieldToEdit)) {
          bot.sendMessage(chatId, `Yangi qiymatni kiriting: ${fieldToEdit}`);

          // Yangi qiymatni qabul qilish
          bot.once("message", (valueMsg) => {
            const newValue = valueMsg.text;

            // Setni yangilash
            const oldValue = setToEdit[fieldToEdit];
            setToEdit[fieldToEdit] = newValue;

            // O‘zgarishlarni saqlash
            saveDataToFile();

            // Natijani ko‘rsatish
            const updatedDetails = `
Set muvaffaqiyatli tahrirlandi:
O‘zgartirilgan maydon: ${fieldToEdit}
Oldingi qiymat: ${oldValue || "Noma'lum"}
Yangi qiymat: ${newValue}

Hozirgi set holati:
ID: ${setToEdit.id}
Brend: ${setToEdit.brend}
Nom: ${setToEdit.car}
Kolleksiya: ${setToEdit.collection || 'Noma\'lum'}
Reduktor: ${setToEdit.reduktor || 'Noma\'lum'}
Forsunka: ${setToEdit.forsunka || 'Noma\'lum'}
Inyektor: ${setToEdit.injektor || 'Noma\'lum'}
Ballon: ${setToEdit.ballon || 'Noma\'lum'}
Multiklapan: ${setToEdit.multiklapan || 'Noma\'lum'}
Filtr: ${setToEdit.filter || 'Noma\'lum'}
Qo‘shimcha ma'lumot: ${setToEdit.extra || 'Noma\'lum'}
            `;
            bot.sendMessage(chatId, updatedDetails, mainMenu);
          });
        } else {
          bot.sendMessage(chatId, "Noto‘g‘ri maydon nomi kiritildi.", mainMenu);
        }
      });
    } else {
      bot.sendMessage(chatId, "Set ID noto‘g‘ri yoki topilmadi.", mainMenu);
    }
  });
}


// Setni o'chirish funksiyasi
function deleteSetStart(chatId) {
  bot.sendMessage(chatId, "O‘chirish uchun setning ID raqamini kiriting:");

  bot.once("message", (idMsg) => {
    const setId = idMsg.text.trim();
    const setIndex = data.products.findIndex((set) => set.id === setId);

    if (setIndex !== -1) {
      const setToDelete = data.products[setIndex];

      // Korzinka mavjudligini tekshirish va qo‘shish
      if (!data.korzinka) {
        data.korzinka = [];
      }
      data.korzinka.push(setToDelete);

      // Asosiy ro‘yxatdan o‘chirish
      data.products.splice(setIndex, 1);

      // O‘zgarishlarni saqlash
      saveDataToFile();

      // Admin uchun tasdiq xabari
      const deleteConfirmation = `
✅ Set muvaffaqiyatli o‘chirildi va korzinkaga qo‘shildi:
🔹 **ID**: ${setToDelete.id}
🔹 **Brend**: ${setToDelete.brend}
🔹 **Nom**: ${setToDelete.car}
      `;
      // Asosiy menyuga qaytarish
      bot.sendMessage(chatId,deleteConfirmation , mainMenu);
    } else {
      bot.sendMessage(
        chatId,
        "❌ Set ID noto‘g‘ri yoki topilmadi. Iltimos, qayta urinib ko‘ring.",
        mainMenu
      );
    }
  });
}

// Faylni saqlash helperi
function saveDataToFile() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}
