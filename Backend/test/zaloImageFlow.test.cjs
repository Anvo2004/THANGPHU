const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// Exercise service orchestration without contacting OA or writing to MongoDB.
function stub(modulePath, exports) {
  const id = require.resolve(modulePath);
  require.cache[id] = { id, filename: id, loaded: true, exports };
}

const source = "https://source.example.test/CMS14/pic/thumb/news.jpg";
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
stub("../src/services/newsScrapeService", {
  fetchNewsDetail: async () => [
    { type: "text", paragraphs: ["Nội dung đầy đủ"] },
    { type: "image", url: source },
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
const { buildCard } = require("../src/services/newsCardService");

test("new OA article submits hosted cover and body images", async () => {
  const result = await ensureArticle(news);
  assert.equal(result.articleId, "article-1");
  assert.equal(result.fullContent, true);
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].item.coverPhotoUrl, hosted);
  assert.equal(submissions[0].item.body.find((block) => block.type === "image").url, hosted);
  assert.deepEqual(imageCalls[0], { url: source, required: true });
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
  assert.deepEqual(imageCalls, [{ url: source, required: true }]);
});

test("failed image preparation stops article submission and card creation", async () => {
  imageFailure = true;
  await assert.rejects(ensureArticle(news), /Không chuẩn bị được ảnh/);
  await assert.rejects(buildCard(news), /Không chuẩn bị được ảnh/);
  assert.equal(submissions.length, 0);
});
