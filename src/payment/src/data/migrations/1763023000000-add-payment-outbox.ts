import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentOutbox1763023000000 implements MigrationInterface {
  name = 'AddPaymentOutbox1763023000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_outbox_message" ("id" SERIAL NOT NULL, "exchangeName" character varying NOT NULL, "payload" text NOT NULL, "messageId" character varying NOT NULL, "traceId" character varying NOT NULL, "idempotencyKey" character varying NOT NULL, "producer" character varying NOT NULL, "occurredAt" TIMESTAMP NOT NULL, "useEnvelope" boolean NOT NULL DEFAULT true, "attempts" integer NOT NULL DEFAULT '0', "nextAttemptAt" TIMESTAMP NOT NULL, "lastError" text, "deliveredAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP, CONSTRAINT "UQ_payment_outbox_message_message_id" UNIQUE ("messageId"), CONSTRAINT "PK_payment_outbox_message_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_outbox_pending" ON "payment_outbox_message" ("nextAttemptAt") WHERE "deliveredAt" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_outbox_pending"`);
    await queryRunner.query(`DROP TABLE "payment_outbox_message"`);
  }
}
