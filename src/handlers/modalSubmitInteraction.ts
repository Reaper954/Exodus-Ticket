import { Client, ModalSubmitInteraction } from 'discord.js';
import { getOrCreateConfig, updateConfig } from '../services/configService';
import { buildSetupComponents, buildSetupEmbed } from './setupView';
import { createTicketChannel } from '../services/ticketService';
import { CUSTOM_IDS } from '../utils/types';

export async function handleModalSubmitInteraction(
  client: Client,
  interaction: ModalSubmitInteraction
) {
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'This modal only works in a server.', ephemeral: true });
    return;
  }

  switch (interaction.customId) {
    case CUSTOM_IDS.ticketCreateModal: {
      const config = await getOrCreateConfig(interaction.guildId);
      const reason = interaction.fields.getTextInputValue('reason');
      const details = interaction.fields.getTextInputValue('details');

      try {
        const result = await createTicketChannel({
          client,
          guild: interaction.guild,
          config,
          openerId: interaction.user.id,
          reason,
          details,
        });

        if (!result.created) {
          await interaction.reply({
            content: `You already have an open ticket: ${result.existingChannel}`,
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content: `Your ticket has been created: ${result.channel}`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Something went wrong while creating your ticket. Check your setup and permissions.',
          ephemeral: true,
        });
      }
      return;
    }

    case CUSTOM_IDS.setupPanelModal: {
      const panelTitle = interaction.fields.getTextInputValue('panelTitle');
      const buttonLabel = interaction.fields.getTextInputValue('buttonLabel');
      const panelDescription = interaction.fields.getTextInputValue('panelDescription');

      const config = await updateConfig(interaction.guildId, {
        panelTitle,
        buttonLabel,
        panelDescription,
      });

      await interaction.reply({
        embeds: [buildSetupEmbed(config)],
        components: buildSetupComponents(),
        ephemeral: true,
      });
      return;
    }

    default:
      return;
  }
}
