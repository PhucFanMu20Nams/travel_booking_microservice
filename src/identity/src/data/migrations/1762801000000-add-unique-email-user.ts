import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueEmailUser1762801000000 implements MigrationInterface {
  name = 'AddUniqueEmailUser1762801000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user" a
      USING "user" b
      WHERE a.id > b.id
        AND a.email = b.email
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_user_email'
            AND conrelid = '"user"'::regclass
        ) THEN
          ALTER TABLE "user" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email");
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "UQ_user_email"
    `);
  }
}
