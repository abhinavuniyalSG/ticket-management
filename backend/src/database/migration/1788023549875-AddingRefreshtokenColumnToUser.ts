import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddingRefreshtokenColumnToUser1788023549875 implements MigrationInterface {
  name = "AddingRefreshtokenColumnToUser1788023549875";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "refreshToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
  }
}
