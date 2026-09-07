import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetTokenToUser1788700000000
  implements MigrationInterface
{
  name = "AddPasswordResetTokenToUser1788700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_token_expires" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token"`,
    );
  }
}
