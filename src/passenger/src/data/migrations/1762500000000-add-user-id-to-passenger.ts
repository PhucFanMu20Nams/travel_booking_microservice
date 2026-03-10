import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToPassenger1762500000000 implements MigrationInterface {
  name = 'AddUserIdToPassenger1762500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "passenger" ADD "userId" integer`);
    await queryRunner.query(`UPDATE "passenger" SET "userId" = "id" WHERE "userId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "passenger" ALTER COLUMN "userId" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "passenger" DROP COLUMN "userId"`);
  }
}
