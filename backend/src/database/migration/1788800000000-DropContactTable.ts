import type { MigrationInterface, QueryRunner } from "typeorm";

export class DropContactTable1788800000000 implements MigrationInterface {
  name = "DropContactTable1788800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_user_id"`);
    await queryRunner.query(`DROP TABLE "contact"`);
    await queryRunner.query(`DROP TYPE "public"."contact_contact_type_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."contact_contact_type_enum" AS ENUM('phone', 'whatsapp', 'linkedin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contact" ("id" uuid NOT NULL DEFAULT uuidv7(), "user_id" uuid NOT NULL, "contact_type" "public"."contact_contact_type_enum" NOT NULL, "contact_detail" character varying(500) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6833e6be7163a98c45203bb1cea" UNIQUE ("contact_type", "contact_detail"), CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contact_user_id" ON "contact" ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
