const test = require("node:test");
const assert = require("node:assert/strict");
const { parseNewsListing, parseDocumentListing } = require("../src/services/portalParser");
const { parseNewsDetail, parseNewsPage } = require("../src/services/newsScrapeService");
const base = "https://thangphu.danang.gov.vn/";

test("CMS14 cards retain content, normalize HTTPS and deduplicate", () => {
  const html = `<div class="DnnModule"><h2><span class="Title-Kieu1"><a>Kinh tế</a></span></h2>
    <div class="QTI_tinthuong"><div class="noidung"><img src="/CMS14/pic/example.jpg">
    <div class="gioithieu"><div class="tieude"><a href="http://thangphu.danang.gov.vn/chi-tiet-tin/group/156/nid/648/example"><h2>Bài tin mẫu</h2></a></div>
    <p class="ngaynguoiluot">10/10/2026</p><p>Nội dung tóm tắt.</p></div></div></div></div>
    <a href="/chi-tiet-tin/group/156/nid/648/example">Bài tin mẫu</a>
    <a href="https://example.com/nid/999/test">Tin bên ngoài</a>`;
  const items = parseNewsListing(html, base);
  assert.equal(items.length, 1);
  assert.equal(items[0].nid, 648);
  assert.equal(items[0].title, "Bài tin mẫu");
  assert.equal(items[0].tag, "Kinh tế");
  assert.equal(items[0].summary, "Nội dung tóm tắt.");
  assert.equal(items[0].date, "10/10/2026");
  assert.equal(items[0].imageUrl, `${base}CMS14/pic/example.jpg`);
  assert.ok(items[0].link.startsWith(base));
});

test("Documents use explicit number/date columns and decode links", () => {
  const html = `<table class="rgMasterTable"><tr class="rgRow"><td>1</td>
    <td><span id="row_lbl_SoKyHieu">258/KH-UBND</span></td>
    <td><span id="row_lbl_NgayBanHanh">10/08/2026</span></td>
    <td><a class="newPage" href="/Default.aspx?tabid=135&amp;ID=167">Kế hoạch 2026</a></td>
    </tr></table><table><tr><td>Lịch tháng 10</td></tr></table>`;
  assert.deepEqual(parseDocumentListing(html, base), [{
    title: "Kế hoạch 2026", detailUrl: `${base}Default.aspx?tabid=135&ID=167`,
    soHieu: "258/KH-UBND", dateStr: "10/08/2026",
  }]);
});

test("Detail keeps text/image/file order and excludes site chrome", () => {
  const blocks = parseNewsDetail(`<h2 class="qti_gioithieu">Tóm tắt</h2>
    <div class="qti_ct_noidung"><p>Đoạn đầu</p><img src="/photo.jpg">
    <p>Đoạn sau</p><a href="/document.pdf">Tải về</a><script>ignore()</script></div>
    <footer>Nội dung ngoài bài</footer>`, base);
  assert.deepEqual(blocks.map(b => b.type), ["text", "image", "text", "file"]);
  assert.deepEqual(blocks[0].paragraphs, ["Tóm tắt", "Đoạn đầu"]);
  assert.equal(blocks[1].url, `${base}photo.jpg`);
  assert.equal(blocks[3].url, `${base}document.pdf`);
  assert.ok(!JSON.stringify(blocks).includes("Nội dung ngoài bài"));
});

test("detail metadata uses actual publication time in Vietnam and original body image", () => {
  const page = parseNewsPage(`<img src="/CMS14/pic/thumb/tiny.jpg">
    <p class="qti_ct_thongtin">Ngày đăng: <span>12:07 | 07/10/2026</span> Lượt xem: 93</p>
    <h2 class="qti_gioithieu">Bài viết về sự kiện ngày 06/10/2026</h2>
    <div class="qti_ct_noidung"><img src="/Portals/0/full.jpg"><p>Nội dung</p></div>`, base);
  assert.equal(page.publishedAt.toISOString(), "2026-10-07T05:07:00.000Z");
  assert.equal(page.date, "07/10/2026");
  assert.equal(page.originalImageUrl, `${base}Portals/0/full.jpg`);
});

test("missing/invalid publication dates stay unknown instead of using scrape time", () => {
  for (const stamp of ["", "12:07 | 31/02/2026", "25:00 | 07/10/2026"]) {
    const page = parseNewsPage(`<p class="qti_ct_thongtin">${stamp}</p>
      <div class="qti_ct_noidung"><p>Sự kiện ngày 07/10/2026</p></div>`, base);
    assert.equal(page.publishedAt, null);
    assert.equal(page.originalImageUrl, "");
  }
});
