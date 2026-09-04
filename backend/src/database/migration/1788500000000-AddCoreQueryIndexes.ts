import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoreQueryIndexes1788500000000 implements MigrationInterface {
  name = "AddCoreQueryIndexes1788500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_department_id" ON "ticket" ("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_assigned_to" ON "ticket" ("assigned_to")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_created_by" ON "ticket" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_created_at" ON "ticket" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_closed_at_when_closed" ON "ticket" ("closed_at") WHERE "status" = 'closed'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contact_user_id" ON "contact" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_department_id_role" ON "users" ("department_id", "role")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_department_id_role"`);
    await queryRunner.query(`DROP INDEX "IDX_contact_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_ticket_closed_at_when_closed"`);
    await queryRunner.query(`DROP INDEX "IDX_ticket_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_ticket_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_ticket_assigned_to"`);
    await queryRunner.query(`DROP INDEX "IDX_ticket_department_id"`);
  }
}
