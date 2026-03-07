const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const axios = require("axios");

exports.sendTelegramNotification = onDocumentCreated({
    document: "partners/{docId}",
    secrets: ["TG_TOKEN"]
}, async (event) => {
    const data = event.data.data();
    const token = process.env.TG_TOKEN;
    const chatId = "6212845501";

    // 1. ПОДГОТОВКА ДАННЫХ (сначала считаем, потом пишем текст)
    const pub = (isVisible) => isVisible ? " — 👁️" : " — 🔒";
    const statusMap = { 'private': 'ФО', 'fop': 'ФОП', 'legal': 'Юр. особа' };

    const messengers = [];
    if (data.viber) messengers.push("Viber");
    if (data.telegram) messengers.push("TG");

    // 2. СБОРКА ТЕКСТА
    let text = `🐾 **АНКЕТА ПАРТНЕРА**\n`;
    text += `━━━━━━━━━━━━━\n\n`;

    // Блок А: Личные данные
    text += `👤 **Прізвище:** ${data.last_name || '—'}${pub(data.pub_last_name)}\n`;
    text += `👤 **Ім'я:** ${data.first_name || '—'}${pub(data.pub_first_name)}\n`;
    text += `💼 **Статус:** ${statusMap[data.status] || '—'}\n`;
    text += `📍 **Місто:** ${data.city || '—'}${pub(data.pub_city)}\n`;
    text += `📞 **Тел:** ${data.phone || '—'}${pub(data.pub_phone)}\n`;

    text += `━━━━━━━━━━━━━\n`;
    text += `📱 **Зв'язок:** ${messengers.join(", ") || 'не вказано'}\n`;
    text += `👥 **У групі:** ${data.koto_member === 'yes' ? 'Так ✅' : 'Ні ❌'}\n`;

    // Блок Б: Категории
    text += `\n**🛠 КАТЕГОРІЇ:**\n`;
    const cats = [];
    if (data.is_kennel) cats.push("🏠 Зареєстрований розплідник");
    if (data.is_breeder_no_reg) cats.push("🐾 Розведення без реєстрації");
    if (data.is_volunteer) cats.push("🤝 Зоо волонтери");
    if (data.is_shelter) cats.push("🏢 Зоо притулок");
    if (data.is_shop) cats.push("🛒 Зоомагазин / Торгівля");
    if (data.is_groomer) cats.push("✂️ Грумер");
    if (data.is_vet) cats.push("🩺 Ветеринар / Клініка");
    if (data.is_transport) cats.push("🚐 Перевезення тварин");

    text += cats.length > 0 ? cats.join("\n") : "Не обрано";

    if (data.kennel_name) {
        text += `\n\n**Назва:** ${data.kennel_name}${pub(data.pub_kennel_name)}`;
    }

    // Блок В: Описание
    if (data.catalog_text) {
        text += `\n\n**📝 ПРО СЕБЕ:**\n_${data.catalog_text}_`;
    }

    // 3. ОТПРАВКА
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error("Ошибка TG:", error.response ? error.response.data : error.message);
    }
});
