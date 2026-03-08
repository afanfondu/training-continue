import type { DataSource } from 'typeorm';

/**
 * Clears all rows from every entity table in the provided TypeORM DataSource.
 *
 * For each entity repository this temporarily disables foreign key checks, clears the table, and then re-enables foreign key checks.
 *
 * @param dataSource - The TypeORM DataSource whose entity tables will be cleared
 */
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
