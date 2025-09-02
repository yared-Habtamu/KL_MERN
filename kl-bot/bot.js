// Telegram bot for registration, access control, and main menu
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const TOKEN = process.env.BOT_TOKEN;
const BASEURL = process.env.BASEURL || "http://localhost:5173"; // frontend base url
const APIURL = process.env.APIURL || "http://localhost:4000/api"; // backend API base url

const bot = new TelegramBot(TOKEN, { polling: true });

// Helper: check if user is registered
async function isRegistered(telegramUsername, telegramChatId) {
  try {
    const res = await axios.get(`${APIURL}/users/telegram`, {
      params: { telegramUsername, telegramChatId },
    });
    return res.data && res.data.user;
  } catch (e) {
    return false;
  }
}

// Helper: register user
async function registerUser(telegramUsername, telegramChatId) {
  try {
    const res = await axios.post(`${APIURL}/users/register-telegram`, {
      telegramUsername,
      telegramChatId,
    });
    return res.data && res.data.user;
  } catch (e) {
    return null;
  }
}

// Helper: get user role
async function getUserRole(telegramUsername, telegramChatId) {
  try {
    const res = await axios.get(`${APIURL}/users/telegram`, {
      params: { telegramUsername, telegramChatId },
    });
    return res.data && res.data.user && res.data.user.role;
  } catch (e) {
    return "client";
  }
}

// Main menu keyboard
function isLocalhost(url) {
  try {
    const u = new URL(url);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch (e) {
    return true;
  }
}

function mainMenuKeyboard() {
  const local = isLocalhost(BASEURL);
  if (!local && BASEURL.startsWith("https")) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Dashboard", url: `${BASEURL}` },
            { text: "Deposit", url: `${BASEURL}/deposit` },
          ],
          [
            { text: "Withdraw", url: `${BASEURL}/withdraw` },
            { text: "Wallet", url: `${BASEURL}/wallet` },
          ],
          [{ text: "Lotteries", url: `${BASEURL}` }],
        ],
      },
    };
  }

  // fallback for localhost/dev: use callback buttons and reply with the link on press
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Dashboard", callback_data: "open_dashboard" },
          { text: "Deposit", callback_data: "open_deposit" },
        ],
        [
          { text: "Withdraw", callback_data: "open_withdraw" },
          { text: "Wallet", callback_data: "open_wallet" },
        ],
        [{ text: "Lotteries", callback_data: "open_lotteries" }],
      ],
    },
  };
}

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramUsername = msg.from.username || "";
  const telegramChatId = String(chatId);

  // Check registration
  const user = await isRegistered(telegramUsername, telegramChatId);
  if (user) {
    // Already registered, show main menu
    bot.sendMessage(
      chatId,
      "Welcome back! Here is your main menu:",
      mainMenuKeyboard()
    );
    return;
  }
  // Not registered, show Start -> Register
  bot.sendMessage(chatId, "Welcome! Please press Register to continue.", {
    reply_markup: {
      inline_keyboard: [[{ text: "Register", callback_data: "register" }]],
    },
  });
});

// Handle Register button
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const telegramUsername = query.from.username || "";
  const telegramChatId = String(chatId);

  if (query.data === "register") {
    // Register user
    const user = await registerUser(telegramUsername, telegramChatId);
    if (user) {
      bot.sendMessage(
        chatId,
        "Registration successful! Redirecting to your home page...",
        mainMenuKeyboard()
      );
    } else {
      bot.sendMessage(
        chatId,
        "Registration failed. Please try again or contact support."
      );
    }
    return;
  }
  // handle open_* callbacks for localhost fallback
  if (query.data && query.data.startsWith("open_")) {
    let path = "";
    switch (query.data) {
      case "open_dashboard":
        path = "";
        break;
      case "open_deposit":
        path = "/deposit";
        break;
      case "open_withdraw":
        path = "/withdraw";
        break;
      case "open_wallet":
        path = "/wallet";
        break;
      case "open_lotteries":
        path = "";
        break;
    }
    const url = `${BASEURL.replace(/\/$/, "")}${path}`;
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, `Open this link in your browser: ${url}`);
    return;
  }
  if (query.data === "open_register") {
    const url = `${BASEURL.replace(/\/$/, "")}/register`;
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(chatId, `Open this link in your browser: ${url}`);
    return;
  }
});

// Middleware: restrict all other commands to registered users only
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const telegramUsername = msg.from.username || "";
  const telegramChatId = String(chatId);
  // Allow /start always
  if (msg.text && msg.text.startsWith("/start")) return;
  // Check registration
  const user = await isRegistered(telegramUsername, telegramChatId);
  if (!user) {
    // if local, avoid sending HTTP localhost URL as inline keyboard (Telegram rejects it)
    if (isLocalhost(BASEURL)) {
      bot.sendMessage(
        chatId,
        "You must register to use the bot. Please register here:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Register", callback_data: "open_register" }],
            ],
          },
        }
      );
    } else {
      bot.sendMessage(
        chatId,
        "You must register to use the bot. Please register here:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Register", url: `${BASEURL}/register` }],
            ],
          },
        }
      );
    }
    return;
  }
  // If registered, show main menu for any other message
  bot.sendMessage(chatId, "Main menu:", mainMenuKeyboard());
});

// Agent application (optional):
// You can add a button in the web app for agent application, or extend the bot to handle it.
// For now, user remains client until approved by admin in backend.

console.log("Telegram bot started.");
