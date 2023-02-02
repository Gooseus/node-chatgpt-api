#!/usr/bin/env node
import fs from "fs";
import { pathToFileURL } from "url";
import ChatGPTClient from "../src/ChatGPTClient.js";
import boxen from "boxen";
import ora from "ora";
import clipboard from "clipboardy";
import inquirer from "inquirer";

import { personas } from "../personas/index.js";

const arg = process.argv.find((arg) => arg.startsWith("--settings"));
let path;
if (arg) {
  path = arg.split("=")[1];
} else {
  path = "./settings.js";
}

let settings;
if (fs.existsSync(path)) {
  // get the full path
  const fullPath = fs.realpathSync(path);
  settings = (await import(pathToFileURL(fullPath).toString())).default;
} else {
  if (arg) {
    console.error(
      `Error: the file specified by the --settings parameter does not exist.`
    );
  } else {
    console.error(`Error: the settings.js file does not exist.`);
  }
  process.exit(1);
}

console.log(
  boxen("ChatGPT CLI", {
    padding: 0.7,
    margin: 1,
    borderStyle: "double",
    dimBorder: true,
  })
);

await conversation();

async function startPrompt() {
  const { message } = await inquirer.prompt([
    {
      type: "editor",
      name: "message",
      message: "Write a message:",
      waitUserInput: true,
    },
  ]);

  if (message === "" || message === "\n") {
    return startPrompt();
  }
  return message;
}

async function conversation(
  conversationId = null,
  parentMessageId = null,
  chatGptClient = null
) {
  if (!chatGptClient) {
    const { model } = await inquirer.prompt([
      {
        type: "list",
        name: "model",
        message: "Select a model:",
        choices: ["Ada", "Babbage"],
        filter: function (val) {
          return personas[val];
        },
      },
    ]);

    chatGptClient = new ChatGPTClient(
      settings.openaiApiKey,
      model,
      settings.chatGptClient
      // settings.cacheOptions
    );
  }

  const message = await startPrompt();
  if (message === "!exit") {
    return true;
  }
  const spinner = ora("ChatGPT is typing...");
  spinner.prefixText = "\n";
  spinner.start();
  const response = await chatGptClient.sendMessage(message, {
    conversationId,
    parentMessageId,
  });
  spinner.stop();
  conversationId = response.conversationId;
  parentMessageId = response.messageId;
  console.log(
    boxen(response.response, {
      title: "ChatGPT",
      padding: 0.7,
      margin: 1,
      dimBorder: true,
    })
  );
  await clipboard.write(response.response);
  return conversation(conversationId, parentMessageId, chatGptClient);
}
