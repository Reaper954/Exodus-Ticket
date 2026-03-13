import {
  ChatInputCommandInteraction,
  Client,
  Colors,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { AppDataSource } from '../typeorm';
import { Ticket } from '../typeorm/entities/Ticket';
import { getOrCreateConfig } from '../services/configService';
import { buildSetupComponents, buildSetupEmbed } from './setupView';
import { isStaffMember, sendLog, syncTicketMessage } from '../services/ticketService';

const ticketRepo = AppDataSource.getRepository(Ticket);

async function getTicketOrReply(interaction: ChatInputCommandInteraction) {
  const ticket = await ticketRepo.findOneBy({ channelId: interaction.channelId });
  if (!ticket) {
    await interaction.reply({
      content: 'This command only works inside a ticket channel.',
      ephemeral: true,
    });
    return null;
  }
  return ticket;
}

function memberIsStaff(interaction: ChatInputCommandInteraction, supportRoleId: string | null) {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (!supportRoleId) return false;
  return member.roles.cache.has(supportRoleId);
}

export async function handleChatInputCommand(
  client: Client,
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'This bot only works in a server.', ephemeral: true });
    return;
  }

  const config = await getOrCreateConfig(interaction.guildId);

  switch (interaction.commandName) {
    case 'setup': {
      await interaction.reply({
        embeds: [buildSetupEmbed(config)],
        components: buildSetupComponents(),
        ephemeral: true,
      });
      return;
    }

    case 'help': {
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle('🎟 Ticket Bot - Help Menu')
        .setDescription('Here are the available commands for the advanced Exodus ticket system.')
        .addFields(
          {
            name: '⚙️ Setup & Configuration',
            value: '`/setup` - Open the setup wizard\n`/help` - Show this help menu',
          },
          {
            name: '🎫 Ticket Management',
            value:
              '`/claim` - Claim the current ticket\n`/close` - Close the current ticket\n`/close-request <reason>` - Request ticket closure\n`/reopen` - Reopen a closed ticket\n`/rename <name>` - Rename the current ticket channel',
          },
          {
            name: '👥 User Management',
            value: '`/add <user>` - Add a user to the ticket\n`/remove <user>` - Remove a user from the ticket',
          }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    case 'claim': {
      const ticket = await getTicketOrReply(interaction);
      if (!ticket) return;
      if (!memberIsStaff(interaction, config.supportRoleId)) {
        await interaction.reply({ content: 'Only staff can claim tickets.', ephemeral: true });
        return;
      }
      ticket.claimedById = interaction.user.id;
      await ticketRepo.save(ticket);
      await syncTicketMessage(interaction.guild, ticket);
      await sendLog(config, interaction.guild, '🧷 Ticket Claimed', [
        `Ticket: <#${interaction.channelId}>`,
        `Staff: <@${interaction.user.id}>`,
      ]);
      await interaction.reply({ content: `You claimed this ticket.`, ephemeral: false });
      return;
    }

    case 'close': {
      const ticket = await getTicketOrReply(interaction);
      if (!ticket) return;
      if (!memberIsStaff(interaction, config.supportRoleId) && ticket.openerId !== interaction.user.id) {
        await interaction.reply({ content: 'Only staff or the ticket opener can close this ticket.', ephemeral: true });
        return;
      }
      ticket.status = 'closed';
      await ticketRepo.save(ticket);
      await syncTicketMessage(interaction.guild, ticket);
      await sendLog(config, interaction.guild, '🔒 Ticket Closed', [
        `Ticket: <#${interaction.channelId}>`,
        `By: <@${interaction.user.id}>`,
      ]);
      await interaction.reply({ content: 'Ticket closed.' });
      return;
    }

    case 'reopen': {
      const ticket = await getTicketOrReply(interaction);
      if (!ticket) return;
      if (!memberIsStaff(interaction, config.supportRoleId)) {
        await interaction.reply({ content: 'Only staff can reopen tickets.', ephemeral: true });
        return;
      }
      ticket.status = 'open';
      await ticketRepo.save(ticket);
      await syncTicketMessage(interaction.guild, ticket);
      await sendLog(config, interaction.guild, '🔓 Ticket Reopened', [
        `Ticket: <#${interaction.channelId}>`,
        `By: <@${interaction.user.id}>`,
      ]);
      await interaction.reply({ content: 'Ticket reopened.' });
      return;
    }

    case 'rename': {
      const ticket = await getTicketOrReply(interaction);
      if (!ticket) return;
      if (!memberIsStaff(interaction, config.supportRoleId)) {
        await interaction.reply({ content: 'Only staff can rename tickets.', ephemeral: true });
        return;
      }
      const newName = interaction.options.getString('name', true).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90);
      const renameChannel = interaction.channel as TextChannel | null;
      await renameChannel?.setName(newName);
      await sendLog(config, interaction.guild, '✏️ Ticket Renamed', [
        `Ticket: <#${interaction.channelId}>`,
        `New name: ${newName}`,
      ]);
      await interaction.reply({ content: 'Renamed this ticket to `' + newName + '`.' });
      return;
    }

    case 'add':
    case 'remove': {
      const ticket = await getTicketOrReply(interaction);
      if (!ticket) return;
      if (!memberIsStaff(interaction, config.supportRoleId)) {
        await interaction.reply({ content: 'Only staff can change ticket access.', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('user', true);
      const channel = interaction.channel as TextChannel;
      const allow = interaction.commandName === 'add';
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: allow,
        SendMessages: allow,
        ReadMessageHistory: allow,
        AttachFiles: allow,
      });
      await sendLog(config, interaction.guild, allow ? '➕ User Added' : '➖ User Removed', [
        `Ticket: <#${interaction.channelId}>`,
        `User: <@${user.id}>`,
        `By: <@${interaction.user.id}>`,
      ]);
      await interaction.reply({ content: allow ? `Added <@${user.id}> to this ticket.` : `Removed <@${user.id}> from this ticket.` });
      return;
    }

    case 'close-request': {
      const ticket = await getTicketOrReply(interaction);
      if (!ticket) return;
      const reason = interaction.options.getString('reason', true);
      const mention = config.supportRoleId ? `<@&${config.supportRoleId}>` : 'Staff';
      await interaction.reply({
        content: `${mention} close request from <@${interaction.user.id}>: ${reason}`,
      });
      await sendLog(config, interaction.guild, '📩 Close Requested', [
        `Ticket: <#${interaction.channelId}>`,
        `Requested by: <@${interaction.user.id}>`,
        `Reason: ${reason}`,
      ]);
      return;
    }

    default:
      return;
  }
}
