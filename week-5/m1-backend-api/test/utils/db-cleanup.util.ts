import type { DataSource } from 'typeorm';

export async function clearDatabase(dataSource: DataSource): Promise<void> {
  // Get all entity metadata and truncate in reverse dependency order
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`SET FOREIGN_KEY_CHECKS = 0`);
    await repository.clear();
    await repository.query(`SET FOREIGN_KEY_CHECKS = 1`);
  }
}
