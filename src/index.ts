import 'dotenv/config';
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import { AppDataSource } from './data-source';
import { getEnv } from './utils/env';
import { handleButtonInteraction, handleModalSubmit, handleSelectMenuInteraction } from './handlers/buttonInteraction';
import { handleChatInputCommand } from './handlers/chatInputCommand';

const TOKEN = getEnv('BOT_TOKEN');
const CLIENT_ID = getEnv('CLIENT_ID');
const GUILD_ID = getEnv('GUILD_ID');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const rest = new REST({ version: '10' }).setToken(TOKEN);

const adminOnly = PermissionFlagsBits.Administrator;

const commands = [
  new SlashCommandBuilder().setName('setup').setDescription('Open the ticket setup wizard').setDefaultMemberPermissions(adminOnly),
  new SlashCommandBuilder().setName('help').setDescription('Show help for the ticket bot'),
  new SlashCommandBuilder().setName('claim').setDescription('Claim the current ticket'),
  new SlashCommandBuilder().setName('close').setDescription('Close the current ticket'),
  new SlashCommandBuilder().setName('reopen').setDescription('Reopen the current ticket'),
  new SlashCommandBuilder().setName('close-request').setDescription('Ask staff to close the current ticket'),
  new SlashCommandBuilder().setName('rename').setDescription('Rename the current ticket channel')
    .addStringOption((option) => option.setName('name').setDescription('New ticket channel name').setRequired(true)),
  new SlashCommandBuilder().setName('add').setDescription('Add a user to the current ticket')
    .addUserOption((option) => option.setName('user').setDescription('User to add').setRequired(true)),
  new SlashCommandBuilder().setName('remove').setDescription('Remove a user from the current ticket')
    .addUserOption((option) => option.setName('user').setDescription('User to remove').setRequired(true))
].map((command) => command.toJSON() as any);

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(client, interaction);
      return;
    }
    if (interaction.isButton()) {
      await handleButtonInteraction(client, interaction);
      return;
    }
    if (interaction.isAnySelectMenu()) {
      await handleSelectMenuInteraction(interaction as any);
      return;
    }
    if (interaction.isModalSubmit()) {
      await handleModalSubmit(client, interaction);
      return;
    }
  } catch (error) {
    console.error('Interaction error:', error);
    if (interaction.isRepliable()) {
      const content = error instanceof Error ? error.message : 'Something went wrong.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true } as any).catch(() => null);
      } else {
        await interaction.reply({ content, ephemeral: true } as any).catch(() => null);
      }
    }
  }
});

async function start() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    await client.login(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

start();
