const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// Exercise service orchestration without contacting OA or writing to MongoDB.
function stub(modulePath, exports) {
  const id = require.resolve(modulePath);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}

const source = "https://source.example.test/CMS14/pic/thumb/news.jpg";
const original = "https://source.example.test/Portals/0/original.jpg";
const hosted = "https://media.example.test/images/tin/anh/news-v2.jpg";
const articleLink = "https://oa.zalo.me/example-article";
let news;
let imageFailure;
let imageCalls;
let submissions;

beforeEach(() => {
  news = { _id: "news-1", nid: 1, title: "Tin mới", summary: "Nội dung", imageUrl: source, link: "https://source.example.test/news", zalo: {} };
  imageFailure = false;
  imageCalls = [];
  submissions = [];
});

stub("../src/models/News", {
  findById: () => ({ lean: async () => news }),
  updateOne: async () => ({}),
});
stub("../src/models/NewsCardSend", {});
stub("../src/models/SendLog", {});
stub("../src/utils/redis", {});
stub("../src/utils/pdfPages", {});
stub("../src/utils/zaloApi", {});
stub("../src/services/broadcastService", {});
const policy = require("../src/services/newsAutoPolicy");
stub("../src/services/newsAutoPolicy", {
  ...policy,
  getAutoConfig: async () => ({ enabled: true, since: new Date(Date.now() - 60 * 60 * 1000).toISOString() }),
});
stub("../src/services/newsScrapeService", {
  ensureNewsMetadata: async (item) => ({ ...item, originalImageUrl: original }),
  fetchNewsDetail: async () => [
    { type: "text", paragraphs: ["Nội dung đầy đủ"] },
    { type: "image", url: original },
  ],
});
stub("../src/utils/imageHost", {
  zaloFriendlyImage: async (url, options = {}) => {
    imageCalls.push({ url, ...options });
    if (imageFailure) throw new Error("Không chuẩn bị được ảnh cho Zalo");
    return hosted;
  },
});
stub("../src/utils/zaloArticle", {
  createArticle: async (item) => { submissions.push({ item }); return "token"; },
  updateArticle: async (id, item) => { submissions.push({ id, item }); return "token"; },
  verifyArticle: async () => "article-1",
  getArticleDetail: async () => ({ link_view: articleLink }),
});

const { ensureArticle } = require("../src/services/zaloNewsService");
const { buildCard, sendNewsCard } = require("../src/services/newsCardService");

test("new OA article submits hosted cover and body images", async () => {
  const result = await ensureArticle(news);
  assert.equal(result.articleId, "article-1");
  assert.equal(result.fullContent, true);
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].item.coverPhotoUrl, hosted);
  assert.equal(submissions[0].item.body.find((block) => block.type === "image").url, hosted);
  assert.deepEqual(imageCalls[0], { url: original, required: true });
});

test("rebuilding an existing OA article also replaces its cover and keeps its id", async () => {
  news.zalo = { articleId: "article-1", fullContent: false };
  await ensureArticle(news, { force: true });
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].id, "article-1");
  assert.equal(submissions[0].item.coverPhotoUrl, hosted);
});

test("news card uses hosted image even if its OA article already exists", async () => {
  news.zalo = { articleId: "article-1", fullContent: true, linkView: articleLink };
  const { element } = await buildCard(news);
  assert.equal(element.image_url, hosted);
  assert.equal(element.default_action.url, articleLink);
  assert.equal(submissions.length, 0);
  assert.deepEqual(imageCalls, [{ url: original, required: true }]);
});

test("failed image preparation stops article submission and card creation", async () => {
  imageFailure = true;
  await assert.rejects(ensureArticle(news), /Không chuẩn bị được ảnh/);
  await assert.rejects(buildCard(news), /Không chuẩn bị được ảnh/);
  assert.equal(submissions.length, 0);
});

test("automatic delivery rejects an old publication imported today before preparing or sending", async () => {
  news.createdAt = new Date();
  news.publishedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await assert.rejects(sendNewsCard({ newsId: news._id, auto: true }), /Bỏ qua tự động gửi/);
  assert.equal(imageCalls.length, 0);
  assert.equal(submissions.length, 0);
});

test("both automatic OA posting and broadcast filter by publication and import time", async () => {
  const config = require("../src/config");
  config.zaloArticle.enabled = true;
  config.zaloArticle.broadcastEnabled = true;
  const queries = [];
  require("../src/models/News").find = (query) => {
    queries.push(query);
    return { sort: () => ({ limit: () => ({ lean: async () => [] }) }) };
  };
  const service = require("../src/services/zaloNewsService");
  await service.postPendingArticles();
  await service.broadcastPendingArticles();
  assert.equal(queries.length, 2);
  for (const query of queries) {
    assert.ok(query.publishedAt.$gte instanceof Date);
    assert.ok(query.publishedAt.$lte instanceof Date);
    assert.deepEqual(query.createdAt, query.publishedAt);
  }
});
