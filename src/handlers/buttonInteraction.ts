import {
  ActionRowBuilder,
  ButtonInteraction,
  ChannelType,
  Client,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { AppDataSource } from '../typeorm';
import { Ticket } from '../typeorm/entities/Ticket';
import { getOrCreateConfig, updateConfig } from '../services/configService';
import {
  buildPanelComponents,
  buildPanelEmbed,
  sendLog,
  syncTicketMessage,
} from '../services/ticketService';
import { buildSetupComponents, buildSetupEmbed } from './setupView';
import { CUSTOM_IDS } from '../utils/types';

const ticketRepo = AppDataSource.getRepository(Ticket);

export async function handleButtonInteraction(client: Client, interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'This button only works in a server.', ephemeral: true });
    return;
  }

  const config = await getOrCreateConfig(interaction.guildId);

  switch (interaction.customId) {
    case CUSTOM_IDS.createTicket: {
      const modal = new ModalBuilder()
        .setCustomId(CUSTOM_IDS.ticketCreateModal)
        .setTitle('Open a Ticket')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Reason')
              .setRequired(true)
              .setMaxLength(100)
              .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('details')
              .setLabel('Details')
              .setRequired(true)
              .setMaxLength(1000)
              .setStyle(TextInputStyle.Paragraph)
          )
        );

      await interaction.showModal(modal);
      return;
    }

    case CUSTOM_IDS.setupEditPanel: {
      const modal = new ModalBuilder()
        .setCustomId(CUSTOM_IDS.setupPanelModal)
        .setTitle('Edit Ticket Panel')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('panelTitle')
              .setLabel('Panel Title')
              .setRequired(true)
              .setMaxLength(100)
              .setValue(config.panelTitle)
              .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('buttonLabel')
              .setLabel('Button Label')
              .setRequired(true)
              .setMaxLength(80)
              .setValue(config.buttonLabel)
              .setStyle(TextInputStyle.Short)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('panelDescription')
              .setLabel('Panel Description')
              .setRequired(true)
              .setMaxLength(1000)
              .setValue(config.panelDescription)
              .setStyle(TextInputStyle.Paragraph)
          )
        );

      await interaction.showModal(modal);
      return;
    }

    case CUSTOM_IDS.setupDeployPanel: {
      if (!config.panelChannelId || !config.ticketCategoryId) {
        await interaction.reply({
          content: 'Set the panel channel and ticket category first.',
          ephemeral: true,
        });
        return;
      }

      const channel = interaction.guild.channels.cache.get(config.panelChannelId);
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: 'The panel channel is missing or invalid.', ephemeral: true });
        return;
      }

      const sent = await (channel as TextChannel).send({
        embeds: [buildPanelEmbed(config)],
        components: buildPanelComponents(config),
      });

      const updated = await updateConfig(interaction.guildId, { panelMessageId: sent.id });
      await interaction.update({
        embeds: [buildSetupEmbed(updated)],
        components: buildSetupComponents(),
      });
      return;
    }

    case CUSTOM_IDS.setupRefresh: {
      await interaction.update({
        embeds: [buildSetupEmbed(config)],
        components: buildSetupComponents(),
      });
      return;
    }

    case CUSTOM_IDS.ticketClaim:
    case CUSTOM_IDS.ticketClose:
    case CUSTOM_IDS.ticketReopen: {
      const ticket = await ticketRepo.findOneBy({ channelId: interaction.channelId });
      if (!ticket) {
        await interaction.reply({ content: 'Ticket not found for this channel.', ephemeral: true });
        return;
      }

      if (interaction.customId === CUSTOM_IDS.ticketClaim) {
        ticket.claimedById = interaction.user.id;
        await ticketRepo.save(ticket);
        await syncTicketMessage(interaction.guild, ticket);
        await interaction.reply({ content: `Ticket claimed by <@${interaction.user.id}>.` });
        await sendLog(config, interaction.guild, '🧷 Ticket Claimed', [
          `Ticket: <#${interaction.channelId}>`,
          `By: <@${interaction.user.id}>`,
        ]);
        return;
      }

      if (interaction.customId === CUSTOM_IDS.ticketClose) {
        ticket.status = 'closed';
        await ticketRepo.save(ticket);
        await syncTicketMessage(interaction.guild, ticket);
        await interaction.reply({ content: 'Ticket closed.' });
        await sendLog(config, interaction.guild, '🔒 Ticket Closed', [
          `Ticket: <#${interaction.channelId}>`,
          `By: <@${interaction.user.id}>`,
        ]);
        return;
      }

      ticket.status = 'open';
      await ticketRepo.save(ticket);
      await syncTicketMessage(interaction.guild, ticket);
      await interaction.reply({ content: 'Ticket reopened.' });
      await sendLog(config, interaction.guild, '🔓 Ticket Reopened', [
        `Ticket: <#${interaction.channelId}>`,
        `By: <@${interaction.user.id}>`,
      ]);
      return;
    }

    default:
      return;
  }
}
