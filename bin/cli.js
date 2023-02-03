#!/usr/bin/env node
import fs from "fs";
import { pathToFileURL } from "url";
import ChatGPTClient from "../src/ChatGPTClient.js";
import boxen from "boxen";
import ora from "ora";
import clipboard from "clipboardy";
import inquirer from "inquirer";
import InterruptedPrompt from "inquirer-interrupted-prompt";
import { createMachine } from "xstate";

import { personas } from "../personas/index.js";

InterruptedPrompt.fromAll(inquirer);

const conversationMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMD2A7AbmATrAhgC4CWGAdALb7HoC0FY6ArgMRgAexJ6Ut+ADvwDaABgC6iUP1SwupdJJDtEATgAsZEQGYAHACYAjFoCsagzpHGA7ADYANCACeiWgZFkbWtSp061xvRFLQzUAX1CHNCxcAhJyKhp6RlZYMAAbMGRuXgpUCHTRCSQQaVk4hWLlBFsyUzU1GwMbK0NbPWMHZwQ9dQ8rAxUenxsRKy9wyIxsPCJ5Smo6BmYWKIAzYigmHBpeAWJCxVK5DEUqqxUPHWMRHUarbxEBnU7ENwvHtS1Gx+a1PU+JiAotNYnM1hstmA+PxiCwCJgdrRwVADsUjuVTohdFoyH4VPdbLZjNYGi8EAYrFZccZdCIbP8bCoaXorIDgTFZuRUhksrR+DEMPgWLl8mlaNzMoRIKipDJjhVQFUaTYPDYAj5zP59GSejiWvdBjoVJYtFoDGyphzymQJbz+XhBSscGBZjw+QL0PgZSU5RjKlibBorHTAioDIZ6Z4yVpjZoxsZw-UDMZbmMLdEZtbbYQkVNUCwAATIZ2u3jA1De9HyTHVHQ4syBFr1CwqJk601kQKjK5efQWG7pkGc9A29KS3NYfPl8VjrLS8SHX3V-0IHxU8z6L6fQY+HW9ZoDP7BqzEzyDq1zbMTzD5gBG+GQAGtK0uTivrBc-GrvMb-gE9NGNgqi0QEfEYvjnOemZgiWUrXlOeZIrB85FLKZTLoqiCMji-x+JYX5WBYVhkhSOidgmra6MmjwnjoUGguQUTcEwULlisGDrJs2xuuWL7oW+mHkuGOKtkamqUlcAFOK8hHkQMKhaIYBj1CMWj0cOZBMTQLHwSw-A4KgFD8DmxYulKEB8fKNbhucZBeGYJj4UEFKAcBehAUY7SGnoakREClrQYxGDMaxeYsPeT6WX6gluFo7hBLoxhMno7Q3K5ZAgfSowND05jqdaplEFC9qwI6EXPguaKvgqSiICyxiaMYzTnD4ARmB00kIDG8XxuGYY2FcKY2PlMFmcVHpCugYAAO70Hk6Tug6npRRhtVdU0HhqJYA0mCMSVqmSxJUlcthND59K6HoI1BegnGQrp07IuK+DYBZlVoVZK4GPJ1LWDSYYpspJEXH9Yy4dYdY+ddI7IvdbHlStAlrUY2i1C2fy0ucikkbJ7SHkBjR+E1YSAug83wMU7KBTVVZI1UtCBDiNJ0m0IipQMHVdK4MZkA09xJjoynuZS0PzIkSxMIu-E1fTyYNczzRZezbadeYFympSFIqCM-Ra6LsPOtCxBS59gleAYZD4uYei3P87kDCRNyW0yng3CYDQtqLV4lYKJvRWtppkYGWjBt9nj-N9Wh7hoapmj4QQ6Pc5p+VTDEjle5Z+6tZxqGR2iUs1ASqWo0d2aMcW2CI3jtGq+vIfBWd04gJ4W9caotpDugqGSPi1MpCnGuYMaQSnAVp5pwXaaFk6NzLrwDHouLJt9VzaEE6h7iJ32Ed99RBIRddjYtpWerPNZeIv31-kBMZeVHnVapb30fCegyPHRo8ZuPBvTzeZ9fWrS2NxbhfB8J8UwPcVQDU+ClV2Zp6QqFFhwLg-8zbWEtmqFM+hcqNBLp1VwFtjQhjpOXeoMZfLhCAA */
  createMachine({
    id: "conversation",
    initial: "main-menu",
    states: {
      "main-menu": {
        on: {
          "selecting-model": { target: "select-persona" },
          "configuring-api": { target: "configure-api" },
          "exiting-app": { target: "exit" },
        },

        entry: "load-saved-config",
      },
      "configure-api": {
        on: {
          "saving-config": {
            target: "configure-api",
            internal: true,
            actions: "save-config",
          },
        },
      },
      "select-persona": {
        on: {
          "model-selected": { target: "select-convo" },
          "creating-persona": "create-persona",
        },
      },
      "select-convo": {
        on: {
          "convo-selected": { target: "continue-convo" },
          back: "select-persona",
          " creating-convo": { target: "create-convo" },
        },
      },
      "create-convo": {
        on: {
          "convo-created": { target: "select-convo" },
        },
      },
      "continue-convo": {
        on: {
          "prompt-created": {
            target: "continue-convo",
            internal: true,
          },
          back: { target: "select-convo" },

          "configuring-convo": { target: "configure-convo" },
        },
      },
      "create-persona": {
        on: {
          back: "select-persona",

          "new-model-persona": {
            target: "create-persona",
            internal: true,
          },
        },
      },
      "configure-convo": {
        on: {
          "convo-config-saved": {
            target: "configure-convo",
            internal: true,
          },

          back: "continue-convo",
        },
      },
      exit: {
        type: "final",
        entry: "save-exit",
      },
    },
  });

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

async function getNewPrompt() {
  const { message } = await inquirer.prompt([
    {
      type: "editor",
      name: "message",
      message: "Write a message:",
      waitUserInput: true,
    },
  ]);

  if (message === "" || message === "\n") {
    return getNewPrompt();
  }

  return message;
}

async function getSelectModel() {
  const { model } = await inquirer.prompt([
    {
      type: "list",
      name: "model",
      message: "Select a model:",
      choices: Object.keys(personas),
      filter: function (val) {
        return personas[val];
      },
    },
  ]);

  //   return model;
  return new ChatGPTClient(
    settings.openaiApiKey,
    model,
    settings.defaultModelOptions,
    settings.cacheOptions
  );
}

async function conversation(
  conversationId = null,
  parentMessageId = null,
  chatGptClient = null
) {
  if (!chatGptClient) {
    chatGptClient = await getSelectModel();
  }

  let message;
  try {
    message = await getNewPrompt();
  } catch (e) {
    console.log(e);
    if (e === InterruptedPrompt.EVENT_INTERRUPTED) {
        return conversation(conversationId, parentMessageId, await getSelectModel());
    }
  }

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
