import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPassengerInboxAndFreshness1763022000000 implements MigrationInterface {
  name = 'AddPassengerInboxAndFreshness1763022000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "passenger" ADD "sourceUpdatedAt" TIMESTAMP`);
    await queryRunner.query(
      `CREATE TABLE "passenger_processed_message" ("id" SERIAL NOT NULL, "consumer" character varying NOT NULL, "messageKey" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_passenger_processed_message_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_passenger_processed_message_consumer_key" ON "passenger_processed_message" ("consumer", "messageKey")`
    );
    await queryRunner.query(
      `UPDATE "passenger" SET "sourceUpdatedAt" = COALESCE("updatedAt", "createdAt") WHERE "sourceUpdatedAt" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_passenger_processed_message_consumer_key"`);
    await queryRunner.query(`DROP TABLE "passenger_processed_message"`);
    await queryRunner.query(`ALTER TABLE "passenger" DROP COLUMN "sourceUpdatedAt"`);
  }
}
