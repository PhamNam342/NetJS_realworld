import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToAttachments1786512933977 implements MigrationInterface {
  name = 'AddDeletedAtToAttachments1786512933977';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD "deletedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "deletedAt"`,
    );
  }
}
