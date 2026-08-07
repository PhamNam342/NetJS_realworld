import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Article } from 'src/articles/entities/article.entity';
@Entity('favorites')
@Unique(['userId', 'articleId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_id',
  })
  userId!: string;

  @Column({
    name: 'article_id',
  })
  articleId!: string;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'user_id',
  })
  user!: User;

  @ManyToOne(() => Article)
  @JoinColumn({
    name: 'article_id',
  })
  article!: Article;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
