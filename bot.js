// bot.js
require('dotenv').config();           // Đọc biến môi trường từ .env

const axios    = require('axios');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const API_KEY      = process.env.API_KEY;
const ACCOUNT_TYPE = parseInt(process.env.ACCOUNT_TYPE ?? '1', 10);
const TYPE         = process.env.TYPE ?? 'null';

const OUTPUT_FILE = path.resolve(__dirname, 'output.txt');


// Trả về thời gian hiện tại dạng [HH:MM:SS]
function now() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

/* ====== Hỏi người dùng quality ====== */
function askQuality() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question('Bạn muốn bao nhiêu quality? ', answer => {
      const q = parseInt(answer, 10);
      if (isNaN(q) || q <= 0) {
        console.log(`${now()} Vui lòng nhập số nguyên lớn hơn 0.`);
        rl.close();
        resolve(askQuality());
      } else {
        rl.close();
        resolve(q);
      }
    });
  });
}

/* ====== Vòng lặp mua ====== */
async function buyLoop(quality) {
  const url =
    `https://api.dongvanfb.net/user/buy?apikey=${encodeURIComponent(API_KEY)}` +
    `&account_type=${ACCOUNT_TYPE}` +
    `&quality=${quality}` +
    `&type=${encodeURIComponent(TYPE)}`;

  console.log(`${now()} Bắt đầu gửi request với quality=${quality} ...`);

  while (true) {
    try {
      const { data } = await axios.get(url);

      if (data.error_code === 200) {
        // Thành công → ghi ra file và thoát
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`${now()} ✔ Thành công! Response đã được lưu vào ${OUTPUT_FILE}`);
        break;
      } else {
        console.log(
          `${now()} ❌ ${data.message} (code: ${data.code || data.error_code}). Đang retry...`
        );
      }
    } catch (err) {
      console.error(`${now()} Lỗi khi gọi API:`, err.message);
    }

    // Đợi 1 giây trước khi thử lại
    await new Promise(res => setTimeout(res, 1000));
  }
}

/* ====== Chạy chương trình ====== */
(async () => {
  try {
    if (!API_KEY) {
      console.error('❌ Chưa có API_KEY trong biến môi trường (.env)');
      process.exit(1);
    }

    const quality = await askQuality();
    await buyLoop(quality);
  } catch (e) {
    console.error(`${now()} Lỗi không mong muốn:`, e);
    process.exit(1);
  }
})();
