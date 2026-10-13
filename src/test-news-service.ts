import { prisma } from './lib/prisma';
import * as newsService from './modules/news/news.service';

async function test() {
  console.log('=== Testing News Service ===\n');

  // 1. پیدا کردن یه ادمین
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('No admin found. Create an admin first.');
    return;
  }

  // 2. ساخت خبر
  console.log('1. Creating news...');
  const news = await newsService.createNews({
    title: 'Test News',
    content: 'This is a test news content',
    authorId: admin.id,
  });
  console.log('   ✅ News created:', news.id);

  // 3. گرفتن همه اخبار
  console.log('\n2. Getting all news...');
  const allNews = await newsService.getAllNews(1, 10);
  console.log('   ✅ Total:', allNews.pagination.total);

  // 4. اضافه کردن کامنت
  console.log('\n3. Adding comment...');
  const comment = await newsService.addComment(news.id, admin.id, 'Great news!');
  console.log('   ✅ Comment added:', comment.id);

  // 5. لایک
  console.log('\n4. Liking news...');
  const like = await newsService.toggleLike(news.id, admin.id, 'LIKE');
  console.log('   ✅', like.message);

  // 6. امتیاز
  console.log('\n5. Rating news...');
  const rating = await newsService.addRating(news.id, admin.id, 5);
  console.log('   ✅', rating.message);

  // 7. حذف خبر
  console.log('\n6. Deleting news...');
  await newsService.deleteNews(news.id);
  console.log('   ✅ News deleted');

  console.log('\n=== All tests passed! ===');
}

test()
  .catch((err) => console.error('❌ Error:', err.message))
  .finally(() => prisma.$disconnect());
