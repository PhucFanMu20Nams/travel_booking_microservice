import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndTokenIndexes1763004000000 implements MigrationInterface {
  name = 'AddUserProfileAndTokenIndexes1763004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."user_passengertype_enum" AS ENUM('0', '1', '2', '3')`);
    await queryRunner.query(`ALTER TABLE "user" ADD "age" integer NOT NULL DEFAULT 18`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "passengerType" "public"."user_passengertype_enum" NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_token_token_user_type_blacklisted" ON "token" ("token", "userId", "type", "blacklisted")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_token_refresh_user_blacklisted" ON "token" ("refreshToken", "userId", "blacklisted")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_token_refresh_user_blacklisted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_token_token_user_type_blacklisted"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passengerType"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "age"`);
    await queryRunner.query(`DROP TYPE "public"."user_passengertype_enum"`);
  }
}
