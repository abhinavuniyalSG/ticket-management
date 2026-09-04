import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOneAdminPerDepartmentConstraint1788600000000
  implements MigrationInterface
{
  name = "AddOneAdminPerDepartmentConstraint1788600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_one_admin_per_department" ON "users" ("department_id") WHERE "role" = 'admin'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_one_admin_per_department"`);
  }
}
