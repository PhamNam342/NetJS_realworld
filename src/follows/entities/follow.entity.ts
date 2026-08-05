import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Người đi follow
  @Column({
    name: 'follower_id',
  })
  followerId!: string;
  // Người được follow
  @Column({
    name: 'following_id',
  })
  followingId!: string;
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
