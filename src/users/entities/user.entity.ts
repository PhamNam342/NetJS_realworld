import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  username!: string;

  @Column({
    unique: true,
    length: 255,
  })
  email!: string;

  @Column({
    length: 255,
  })
  password!: string;

  @Column({
    nullable: true,
  })
  bio?: string;

  @Column({
    nullable: true,
  })
  image?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
