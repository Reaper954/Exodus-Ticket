import { AppDataSource } from '../typeorm';
import { TicketConfig } from '../typeorm/entities/TicketConfig';

const repo = AppDataSource.getRepository(TicketConfig);

export async function getOrCreateConfig(guildId: string): Promise<TicketConfig> {
  let config = await repo.findOneBy({ guildId });
  if (!config) {
    config = repo.create({ guildId });
    await repo.save(config);
  }
  return config;
}

export async function updateConfig(
  guildId: string,
  partial: Partial<TicketConfig>
): Promise<TicketConfig> {
  const config = await getOrCreateConfig(guildId);
  Object.assign(config, partial);
  return repo.save(config);
}
