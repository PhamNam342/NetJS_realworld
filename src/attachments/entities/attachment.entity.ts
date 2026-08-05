import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fileName!: string;

  @Column()
  fileType!: string;

  @Column()
  fileSize!: number;

  @Column()
  url!: string;

  // id của object sở hữu file
  @Column()
  attachableId!: string;

  // User, Article...
  @Column()
  attachableType!: string;

  @CreateDateColumn({
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}
