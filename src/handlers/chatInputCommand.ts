import { ChatInputCommandInteraction, Client, PermissionFlagsBits } from 'discord.js';
import { panelService } from '../services/panelService';
import { renderSetupRoot } from './setupView';
import { ticketService } from '../services/ticketService';
import { AppDataSource } from '../data-source';
import { TicketType } from '../entities/TicketType';

function ensureGuild(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) throw new Error('This command can only be used in a server.');
}

async function isStaff(interaction: ChatInputCommandInteraction, supportRoleIds: string[] = []) {
  if (!interaction.inCachedGuild()) return false;
  if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return true;
  return supportRoleIds.some((id) => interaction.member.roles.cache.has(id));
}

export async function handleChatInputCommand(client: Client, interaction: ChatInputCommandInteraction) {
  ensureGuild(interaction);

  switch (interaction.commandName) {
    case 'setup': {
      const draft = await panelService.getOrCreateDraft(interaction.guildId!);
      const view = renderSetupRoot(draft);

      await interaction.reply({
        ...view,
        ephemeral: true,
      } as any);
      return;
    }

    case 'help': {
      await interaction.reply({
        ephemeral: true,
        content: [
          '**Commands**',
          '`/setup` open the interactive setup wizard',
          '`/claim` claim the current ticket',
          '`/close` close the current ticket',
          '`/reopen` reopen the current ticket',
          '`/rename <name>` rename the current ticket channel',
          '`/add <user>` add a user to the ticket',
          '`/remove <user>` remove a user from the ticket',
          '`/close-request` ping staff that the opener wants the ticket closed',
        ].join('\n'),
      } as any);
      return;
    }

    case 'claim': {
      await ticketService.setClaim(interaction.channelId, interaction.user.id);
      await interaction.reply({
        content: `Claimed by <@${interaction.user.id}>.`,
        ephemeral: true,
      } as any);
      return;
    }

    case 'close': {
      await ticketService.closeTicket(client, interaction.channelId, interaction.user.id);
      await interaction.reply({
        content: 'Ticket closed.',
        ephemeral: true,
      } as any);
      return;
    }

    case 'reopen': {
      await ticketService.reopenTicket(client, interaction.channelId);
      await interaction.reply({
        content: 'Ticket reopened.',
        ephemeral: true,
      } as any);
      return;
    }

    case 'rename': {
      const name = interaction.options.getString('name', true);
      if (interaction.channel?.isTextBased() && 'setName' in interaction.channel) {
        await (interaction.channel as any).setName(name);
      }
      await interaction.reply({
        content: `Renamed ticket to \`${name}\`.`,
        ephemeral: true,
      } as any);
      return;
    }

    case 'add': {
      const user = interaction.options.getUser('user', true);
      if (interaction.channel?.isTextBased() && 'permissionOverwrites' in interaction.channel) {
        await (interaction.channel as any).permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
      }
      await interaction.reply({
        content: `Added <@${user.id}> to the ticket.`,
        ephemeral: true,
      } as any);
      return;
    }

    case 'remove': {
      const user = interaction.options.getUser('user', true);
      if (interaction.channel?.isTextBased() && 'permissionOverwrites' in interaction.channel) {
        await (interaction.channel as any).permissionOverwrites.edit(user.id, {
          ViewChannel: false,
          SendMessages: false,
          ReadMessageHistory: false,
        });
      }
      await interaction.reply({
        content: `Removed <@${user.id}> from the ticket.`,
        ephemeral: true,
      } as any);
      return;
    }

    case 'close-request': {
      const ticketRepo = AppDataSource.getRepository(TicketType);
      const ticket = await ticketService.getTicketByChannel(interaction.channelId);

      if (!ticket) {
        await interaction.reply({
          content: 'This channel is not a tracked ticket.',
          ephemeral: true,
        } as any);
        return;
      }

      const type = await ticketRepo.findOne({ where: { id: ticket.ticketTypeId } });
      const pings =
        type?.supportRoleIds?.length
          ? type.supportRoleIds.map((id) => `<@&${id}>`).join(' ')
          : 'Staff';

      await interaction.reply({
        content: `${pings} — <@${interaction.user.id}> requested this ticket to be closed.`,
      } as any);
      return;
    }
  }
}