import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddingConstraints1787992898863 implements MigrationInterface {
  name = "AddingConstraints1787992898863";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_121ce93fa7c5778a91d37b9bb47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_3020be017b973a0a11e638d4cd2"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_7395ecde6cda2e7fe90253ec59f"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "mail"`);
    await queryRunner.query(
      `ALTER TABLE "department" ADD "department_email" character varying(254) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "UQ_4078fdd95ee1616712ccf1e8f43" UNIQUE ("department_email")`,
    );
    await queryRunner.query(`ALTER TABLE "department" ADD "managed_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "department" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "first_name" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "last_name" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "email" character varying(254) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "ticket_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "ticket_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "title" character varying(200) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'open'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "department_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_afd2c87bee70dd5557f48911e66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ALTER COLUMN "department_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ALTER COLUMN "department_id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "UQ_980e3e1f25ca867c47e38021bfc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP COLUMN "department_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD "department_name" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "UQ_980e3e1f25ca867c47e38021bfc" UNIQUE ("department_name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "FK_33d4fc93803e7192e150216fffb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_036b5f20f93359a0dfe0058facd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."contact_contact_type_enum" RENAME TO "contact_contact_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contact_contact_type_enum" AS ENUM('phone', 'whatsapp', 'linkedin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ALTER COLUMN "contact_type" TYPE "public"."contact_contact_type_enum" USING "contact_type"::"text"::"public"."contact_contact_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."contact_contact_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP COLUMN "contact_detail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "contact_detail" character varying(500) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "ticket" ADD CONSTRAINT "CHK_97c05b6ac1dfd25505c4d18f8d" CHECK (
  (
    status = 'closed'
    AND closed_at IS NOT NULL
  )
  OR
  (
    status <> 'closed'
    AND closed_at IS NULL
  )
)`);
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "UQ_6833e6be7163a98c45203bb1cea" UNIQUE ("contact_type", "contact_detail")`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_121ce93fa7c5778a91d37b9bb47" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_036b5f20f93359a0dfe0058facd" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_3020be017b973a0a11e638d4cd2" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "FK_37792e4e0812cb6fe3e6a4ee83b" FOREIGN KEY ("managed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_afd2c87bee70dd5557f48911e66" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "FK_33d4fc93803e7192e150216fffb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_afd2c87bee70dd5557f48911e66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "FK_37792e4e0812cb6fe3e6a4ee83b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_3020be017b973a0a11e638d4cd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_036b5f20f93359a0dfe0058facd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_121ce93fa7c5778a91d37b9bb47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "UQ_6833e6be7163a98c45203bb1cea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "CHK_97c05b6ac1dfd25505c4d18f8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP COLUMN "contact_detail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD "contact_detail" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contact_contact_type_enum_old" AS ENUM('phone', 'email')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ALTER COLUMN "contact_type" TYPE "public"."contact_contact_type_enum_old" USING "contact_type"::"text"::"public"."contact_contact_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."contact_contact_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."contact_contact_type_enum_old" RENAME TO "contact_contact_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_036b5f20f93359a0dfe0058facd" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "UQ_980e3e1f25ca867c47e38021bfc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP COLUMN "department_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD "department_name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "UQ_980e3e1f25ca867c47e38021bfc" UNIQUE ("department_name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ALTER COLUMN "department_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ALTER COLUMN "department_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_afd2c87bee70dd5557f48911e66" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "department_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD "title" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "ticket_id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ALTER COLUMN "ticket_id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_name"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "first_name"`);
    await queryRunner.query(
      `ALTER TABLE "department" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP COLUMN "managed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "UQ_4078fdd95ee1616712ccf1e8f43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP COLUMN "department_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "mail" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_7395ecde6cda2e7fe90253ec59f" UNIQUE ("mail")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_3020be017b973a0a11e638d4cd2" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_121ce93fa7c5778a91d37b9bb47" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
