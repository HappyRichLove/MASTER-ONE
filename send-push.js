#!/usr/bin/env node

// ============================================
// MASTER ONE — Отправка Push-уведомлений
// ============================================
// Использование:
//   node send-push.js                          — отправить с дефолтным текстом
//   node send-push.js "Заголовок" "Текст"      — свой заголовок и текст
//   node send-push.js "Заголовок" "Текст" "https://youtube.com/..."  — + ссылка
//
// Подписки хранятся в файле subscriptions.json
// (скопируй JSON подписки с телефона и вставь туда)

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// VAPID ключи
const VAPID_PUBLIC = 'BIc4P3VP6bOTOkWqgiMI6YsjkuXemhvTCiVN5nIAU8Gc-s-u-lJ7yNkAKnSGkFDUi0p_z2d1pY29qogiijCjvXw';
const VAPID_PRIVATE = 'cMTf1w9WgL9g9s--0Rhq2sNJ30QY0Mpu7AsXm3qPyps';

webpush.setVapidDetails('mailto:test@masterone.app', VAPID_PUBLIC, VAPID_PRIVATE);

// Аргументы командной строки
const title = process.argv[2] || 'MASTER ONE — Новый пост!';
const body = process.argv[3] || 'Вышел новый ролик на канале! Смотри скорее.';
const url = process.argv[4] || '';

// Загрузить подписки
const subFile = path.join(__dirname, 'subscriptions.json');
if (!fs.existsSync(subFile)) {
    console.log('\n  Файл subscriptions.json не найден!\n');
    console.log('  Создай его так:');
    console.log('  1. Открой приложение на телефоне/в браузере');
    console.log('  2. Нажми "Подписаться"');
    console.log('  3. Скопируй JSON подписки');
    console.log('  4. Вставь в subscriptions.json в формате:\n');
    console.log('  [');
    console.log('    {"endpoint":"https://...","keys":{"p256dh":"...","auth":"..."}}');
    console.log('  ]\n');
    process.exit(1);
}

const subscriptions = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
const payload = JSON.stringify({ title, body, url });

console.log(`\n  Отправляю "${title}" -> ${subscriptions.length} подписчик(ов)...\n`);

let ok = 0, fail = 0;

Promise.all(
    subscriptions.map(sub =>
        webpush.sendNotification(sub, payload)
            .then(() => { ok++; })
            .catch(err => {
                fail++;
                console.log(`  Ошибка: ${err.statusCode || err.message}`);
                if (err.statusCode === 410) {
                    console.log('  ^ Подписка истекла — удали её из subscriptions.json');
                }
            })
    )
).then(() => {
    console.log(`  Готово! Успешно: ${ok}, ошибок: ${fail}\n`);
});
