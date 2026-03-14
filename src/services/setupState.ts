const selectedTypeByGuild = new Map<string, number>();

export function setSelectedType(guildId: string, typeId: number | null) {
  if (typeId === null) {
    selectedTypeByGuild.delete(guildId);
    return;
  }
  selectedTypeByGuild.set(guildId, typeId);
}

export function getSelectedType(guildId: string): number | null {
  return selectedTypeByGuild.get(guildId) ?? null;
}
