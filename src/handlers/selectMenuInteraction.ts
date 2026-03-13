import {
  AnySelectMenuInteraction,
  ChannelType,
  Client,
  RoleSelectMenuInteraction,
} from 'discord.js';
import { updateConfig } from '../services/configService';
import { buildSetupComponents, buildSetupEmbed } from './setupView';
import { CUSTOM_IDS } from '../utils/types';

function selected(interaction: AnySelectMenuInteraction): string | null {
  return interaction.values[0] ?? null;
}

export async function handleSelectMenuInteraction(
  client: Client,
  interaction: AnySelectMenuInteraction
) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This only works inside a server.', ephemeral: true });
    return;
  }

  let partial: Record<string, string | null> | null = null;

  switch (interaction.customId) {
    case CUSTOM_IDS.setupSelectPanelChannel:
      partial = { panelChannelId: selected(interaction) };
      break;
    case CUSTOM_IDS.setupSelectTicketCategory:
      partial = { ticketCategoryId: selected(interaction) };
      break;
    case CUSTOM_IDS.setupSelectLogsChannel:
      partial = { logsChannelId: selected(interaction) };
      break;
    case CUSTOM_IDS.setupSelectSupportRole:
      partial = { supportRoleId: selected(interaction) };
      break;
    default:
      return;
  }

  const updated = await updateConfig(interaction.guildId, partial);

  await interaction.update({
    embeds: [buildSetupEmbed(updated)],
    components: buildSetupComponents(),
  });
}
