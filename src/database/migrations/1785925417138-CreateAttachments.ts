import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttachments1785925417138 implements MigrationInterface {
  name = 'CreateAttachments1785925417138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileName" character varying NOT NULL, "fileType" character varying NOT NULL, "fileSize" integer NOT NULL, "url" character varying NOT NULL, "attachableId" character varying NOT NULL, "attachableType" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attachments"`);
  }
}
