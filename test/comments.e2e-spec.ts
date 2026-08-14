import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

import { User } from '../src/users/entities/user.entity';
import { Article } from '../src/articles/entities/article.entity';
import { Comment } from '../src/comments/entities/comment.entity';
import { Follow } from '../src/follows/entities/follow.entity';

// E2E cần thêm thời gian vì app phải kết nối database/redis thật trước khi chạy test.
jest.setTimeout(30000);

interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    bio: string | null;
    image: string | null;
  };
  token: string;
}

interface TestUserContext {
  token: string;
  user: User;
}

interface CommentAuthorResponse {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

interface CommentResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: CommentAuthorResponse;
}

interface CreateCommentResponse {
  comment: CommentResponse;
}

interface FindCommentsResponse {
  comments: CommentResponse[];
}

describe('CommentsController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let user: User;
  let article: Article;
  let accessToken: string;

  // Reset toàn bộ dữ liệu liên quan sau mỗi case để test không phụ thuộc lẫn nhau.
  const truncateDatabase = async () => {
    if (!dataSource?.isInitialized) {
      return;
    }

    await dataSource.query(`
      TRUNCATE TABLE comments, follows, favorites, articles, users
      RESTART IDENTITY CASCADE
    `);
  };

  // Tạo user bằng API thật để test đi qua controller, service, hash password và sign JWT.
  const registerUser = async (
    username: string,
    email: string,
  ): Promise<TestUserContext> => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username,
        email,
        password: 'password123',
      })
      .expect(201);

    const responseBody = registerResponse.body as RegisterResponse;

    const createdUser = await dataSource.getRepository(User).findOne({
      where: {
        email,
      },
    });

    if (!createdUser) {
      throw new Error(`Test user ${email} was not created`);
    }

    return {
      token: responseBody.token,
      user: createdUser,
    };
  };

  const createArticle = async (author: User): Promise<Article> => {
    const articleRepository = dataSource.getRepository(Article);

    const testArticle = articleRepository.create({
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body',
      tagList: ['nestjs', 'e2e'],
      author,
    });

    return articleRepository.save(testArticle);
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    // Mỗi test bắt đầu từ database rỗng rồi tự fake data cần thiết.
    await truncateDatabase();

    const testUser = await registerUser('testuser', 'test@example.com');

    user = testUser.user;
    accessToken = testUser.token;
    article = await createArticle(user);
  });

  afterEach(async () => {
    // Dọn lại database sau test để kể cả test fail giữa chừng cũng không ảnh hưởng case sau.
    await truncateDatabase();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create a comment and persist it to the test database', async () => {
    // Gọi HTTP endpoint thật với JWT thật thay vì gọi service trực tiếp.
    const response = await request(app.getHttpServer())
      .post(`/api/articles/${article.slug}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        comment: {
          body: 'This is a test comment',
        },
      })
      .expect(201);

    const responseBody = response.body as unknown as CreateCommentResponse;

    // Kiểm tra response đúng contract mà client sẽ nhận được.
    expect(responseBody).toHaveProperty('comment');
    expect(responseBody.comment.id).toEqual(expect.any(String));
    expect(responseBody.comment.body).toBe('This is a test comment');
    expect(responseBody.comment.createdAt).toEqual(expect.any(String));
    expect(responseBody.comment.updatedAt).toEqual(expect.any(String));
    expect(responseBody.comment.author.username).toBe('testuser');
    expect(responseBody.comment.author.bio).toBeNull();
    expect(responseBody.comment.author.image).toBeNull();
    expect(responseBody.comment.author.following).toBe(false);

    const commentRepository = dataSource.getRepository(Comment);

    // Kiểm tra side effect trong database: comment đã lưu đúng author và article.
    const savedComment = await commentRepository.findOne({
      where: {
        body: 'This is a test comment',
      },
      relations: {
        author: true,
        article: true,
      },
    });

    expect(savedComment).toBeDefined();

    expect(savedComment?.author.id).toBe(user.id);
    expect(savedComment?.article.id).toBe(article.id);
  });

  it('should return comments for an article with the author following state', async () => {
    // Reader follow author để kiểm tra field author.following trong response.
    const reader = await registerUser('reader', 'reader@example.com');
    await dataSource.getRepository(Follow).save({
      followerId: reader.user.id,
      followingId: user.id,
    });

    await dataSource.getRepository(Comment).save([
      {
        body: 'Older comment',
        author: user,
        article,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        body: 'Newest comment',
        author: user,
        article,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    // GET comments đi qua OptionalJwtAuthGuard để tính following theo user hiện tại.
    const response = await request(app.getHttpServer())
      .get(`/api/articles/${article.slug}/comments`)
      .set('Authorization', `Bearer ${reader.token}`)
      .expect(200);

    const responseBody = response.body as unknown as FindCommentsResponse;

    expect(responseBody.comments).toHaveLength(2);
    // Service đang sort theo createdAt DESC nên comment mới nhất phải đứng trước.
    expect(responseBody.comments.map((comment) => comment.body)).toEqual([
      'Newest comment',
      'Older comment',
    ]);
    expect(responseBody.comments[0].author).toEqual({
      username: 'testuser',
      bio: null,
      image: null,
      following: true,
    });
  });

  it('should delete the comment owned by the authenticated user', async () => {
    // Tạo comment bằng API trước, sau đó xóa bằng đúng owner.
    const createResponse = await request(app.getHttpServer())
      .post(`/api/articles/${article.slug}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        comment: {
          body: 'Delete me',
        },
      })
      .expect(201);

    const createResponseBody =
      createResponse.body as unknown as CreateCommentResponse;
    const commentId = createResponseBody.comment.id;

    await request(app.getHttpServer())
      .delete(`/api/articles/${article.slug}/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Sau khi DELETE thành công, database không còn record comment đó.
    const deletedComment = await dataSource.getRepository(Comment).findOne({
      where: {
        id: commentId,
      },
    });

    expect(deletedComment).toBeNull();
  });

  it('should reject comment creation when the user is not authenticated', async () => {
    // Không gửi Bearer token nên JwtAuthGuard phải chặn ở tầng controller.
    await request(app.getHttpServer())
      .post(`/api/articles/${article.slug}/comments`)
      .send({
        comment: {
          body: 'Unauthorized comment',
        },
      })
      .expect(401);

    const commentsCount = await dataSource.getRepository(Comment).count();

    // Request bị chặn thì không được tạo dữ liệu rác trong database.
    expect(commentsCount).toBe(0);
  });

  it('should return 404 when creating a comment for a missing article', async () => {
    // Có auth hợp lệ nhưng slug không tồn tại, service phải trả NotFound.
    await request(app.getHttpServer())
      .post('/api/articles/missing-article/comments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        comment: {
          body: 'Comment on missing article',
        },
      })
      .expect(404);

    const commentsCount = await dataSource.getRepository(Comment).count();

    expect(commentsCount).toBe(0);
  });

  it('should reject deleting another user comment', async () => {
    // Comment thuộc user mặc định, nhưng request xóa được gửi bởi user khác.
    const anotherUser = await registerUser(
      'anotheruser',
      'another@example.com',
    );
    const comment = await dataSource.getRepository(Comment).save({
      body: 'Do not delete me',
      author: user,
      article,
    });

    await request(app.getHttpServer())
      .delete(`/api/articles/${article.slug}/comments/${comment.id}`)
      .set('Authorization', `Bearer ${anotherUser.token}`)
      .expect(403);

    // Bị Forbidden thì comment gốc vẫn phải còn trong database.
    const existingComment = await dataSource.getRepository(Comment).findOne({
      where: {
        id: comment.id,
      },
    });

    expect(existingComment).toBeDefined();
  });
});
