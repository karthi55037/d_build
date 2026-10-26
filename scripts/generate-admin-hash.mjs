import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  throw new Error("Run this command in an interactive terminal so the password can be entered privately.");
}

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let password = "";

    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(password);
          return;
        }
        if (character === "\u0008" || character === "\u007f") {
          password = password.slice(0, -1);
          continue;
        }
        if (character >= " ") password += character;
      }
    };

    process.stdin.on("data", onData);
  });
}

const password = await readHidden("Admin password (hidden): ");
if (password.length < 12) {
  throw new Error("Use an admin password with at least 12 characters.");
}

const salt = randomBytes(16);
const hash = await scryptAsync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString("hex")}$${hash.toString("hex")}`);
