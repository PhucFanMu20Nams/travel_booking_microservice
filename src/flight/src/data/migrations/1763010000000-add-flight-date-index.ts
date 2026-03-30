import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlightDateIndex1763010000000 implements MigrationInterface {
  name = 'AddFlightDateIndex1763010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_flight_flightDate"
      ON "flight" ("flightDate")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_flight_flightDate"`);
  }
}
