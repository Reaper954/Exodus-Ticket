import 'reflect-metadata';
import 'dotenv/config';

import {
  ChatInputCommandInteraction,
  ChannelType,
  Client,
  GatewayIntentBits,
  ModalSubmitInteraction,
  PermissionsBitField,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { AppDataSource } from './typeorm';
import { handleChatInputCommand } from './handlers/chatInputCommand';
import { handleButtonInteraction } from './handlers/buttonInteraction';
import { handleSelectMenuInteraction } from './handlers/selectMenuInteraction';
import { handleModalSubmitInteraction } from './handlers/modalSubmitInteraction';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in environment variables.`);
  }
  return value;
}

const CLIENT_ID = getEnv('CLIENT_ID');
const GUILD_ID = getEnv('GUILD_ID');
const TOKEN = getEnv('BOT_TOKEN');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Open the ticket setup wizard')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .toJSON(),
  new SlashCommandBuilder().setName('help').setDescription('Show the help menu').toJSON(),
  new SlashCommandBuilder().setName('claim').setDescription('Claim the current ticket').toJSON(),
  new SlashCommandBuilder().setName('close').setDescription('Close the current ticket').toJSON(),
  new SlashCommandBuilder().setName('reopen').setDescription('Reopen the current ticket').toJSON(),
  new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename the current ticket channel')
    .addStringOption((option) =>
      option.setName('name').setDescription('New channel name').setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to the current ticket')
    .addUserOption((option) => option.setName('user').setDescription('User to add').setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from the current ticket')
    .addUserOption((option) => option.setName('user').setDescription('User to remove').setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('close-request')
    .setDescription('Request closure for the current ticket')
    .addStringOption((option) =>
      option.setName('reason').setDescription('Why this ticket should be closed').setRequired(true)
    )
    .toJSON(),
];

client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(client, interaction as ChatInputCommandInteraction);
      return;
    }

    if (interaction.isButton()) {
      await handleButtonInteraction(client, interaction);
      return;
    }

    if (interaction.isAnySelectMenu()) {
      await handleSelectMenuInteraction(client, interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModalSubmitInteraction(client, interaction as ModalSubmitInteraction);
      return;
    }
  } catch (error) {
    console.error('Interaction error:', error);

    if (interaction.isRepliable()) {
      const payload = {
        content: 'Something went wrong while handling that interaction.',
        ephemeral: true as const,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  }
});

async function main() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    await client.login(TOKEN);

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

main();
