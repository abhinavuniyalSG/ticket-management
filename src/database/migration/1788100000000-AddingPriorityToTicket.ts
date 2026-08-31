import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddingPriorityToTicket1788100000000 implements MigrationInterface {
  name = "AddingPriorityToTicket1788100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "priority" "public"."ticket_priority_enum" NOT NULL DEFAULT 'low'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "priority"`);
    await queryRunner.query(`DROP TYPE "public"."ticket_priority_enum"`);
  }
}
