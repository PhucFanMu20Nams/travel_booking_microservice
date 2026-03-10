import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPassengerUserIdIndex1763005000000 implements MigrationInterface {
  name = 'AddPassengerUserIdIndex1763005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_passenger_user_id_unique" ON "passenger" ("userId") WHERE "userId" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_passenger_user_id_unique"`);
  }
}
