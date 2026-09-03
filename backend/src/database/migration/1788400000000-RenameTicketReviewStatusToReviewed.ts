import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameTicketReviewStatusToReviewed1788400000000
  implements MigrationInterface
{
  name = "RenameTicketReviewStatusToReviewed1788400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ticket_status_enum" RENAME VALUE 'review' TO 'reviewed'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ticket_status_enum" RENAME VALUE 'reviewed' TO 'review'`,
    );
  }
}
