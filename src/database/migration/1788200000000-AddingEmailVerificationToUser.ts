import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddingEmailVerificationToUser1788200000000 implements MigrationInterface {
  name = "AddingEmailVerificationToUser1788200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "is_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "verification_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "verification_token_expires" TIMESTAMP WITH TIME ZONE`,
    );
    // Grandfather in accounts that existed before email verification was introduced,
    // so they aren't locked out of every route pending a verification they were never asked for.
    await queryRunner.query(`UPDATE "user" SET "is_verified" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "verification_token_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "verification_token"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_verified"`);
  }
}
