const Parser = require('rss-parser');
const { extract } = require('@extractus/article-extractor');
const { matchByKeywords, DEFAULT_TAG } = require('./tagger');
const { tagByLLM } = require('./llm-tagger');

const rssParser = new Parser();

// ======================== 数据源配置 ========================
// enrich: true 表示需要用 article-extractor 二次抓取完整正文
const SOURCES = [
  // { name: '36氪', url: 'https://36kr.com/feed' },           // XML 解析错误
  { name: '少数派', url: 'https://sspai.com/feed', enrich: true },
  { name: 'IT之家', url: 'https://www.ithome.com/rss/' },
  { name: '极客公园', url: 'https://mainssl.geekpark.net/rss.rss' },
  // { name: '爱范儿', url: 'https://www.ifanr.com/feed' },    // XML 解析错误
  { name: '雷锋网', url: 'https://www.leiphone.com/feed/' },
  // 知乎热榜 — 无正文，已移除
  { name: '央视新闻', url: 'https://rsshub.rssforever.com/cctv/world' },
  // Hacker News — 无正文，已移除
];

// ======================== article-extractor 抓取完整正文 ========================
async function enrichWithArticleExtractor(items) {
  console.log(`  通过 article-extractor 抓取 ${items.length} 篇文章的完整正文...`);
  let successCount = 0;

  // 逐个串行抓取，避免并发过高
  for (const item of items) {
    if (!item.link) continue;
    try {
      const article = await extract(item.link);
      if (article && article.content) {
        const oldLen = item.content.length;
        // article.content 是 HTML 格式，用 stripHtml 转纯文本
        item.content = stripHtml(article.content);
        successCount++;
        console.log(`    ✅ [${item.title.substring(0, 30)}] ${oldLen} → ${item.content.length} 字符`);
      } else {
        console.log(`    ❌ [${item.title.substring(0, 30)}] 未提取到内容，保留 RSS 原文`);
      }
    } catch (err) {
      console.log(`    ❌ [${item.title.substring(0, 30)}] ${err.message}`);
    }
  }

  console.log(`  完成: 成功 ${successCount}/${items.length}`);
  return items;
}

// ======================== 打标签 ========================
/**
 * 把标签结果写入 item
 * result 形如 { tag, name }
 */
function applyTag(item, result, source) {
  item.tag = result.tag;
  item.tagName = result.name;
  item.tagSource = source;
  return item;
}

/**
 * 给一批新闻打标签
 * 1. 先用关键词匹配标题
 * 2. 匹配不上再调用大模型识别
 * 3. 都失败则用默认标签「综合」
 */
async function tagItems(items) {
  let keywordCount = 0;
  let llmCount = 0;
  let defaultCount = 0;

  // 关键词匹配是同步的，先全部跑一遍；需要 LLM 的收集起来
  const needLLM = [];
  for (const item of items) {
    const keywordTag = matchByKeywords(item.title);
    if (keywordTag) {
      applyTag(item, keywordTag, 'keyword');
      keywordCount++;
    } else {
      needLLM.push(item);
    }
  }

  // 对关键词没匹配上的，调用大模型（串行，避免并发过高）
  if (needLLM.length > 0) {
    console.log(`  关键词匹配 ${keywordCount} 条，${needLLM.length} 条交给大模型识别...`);
    for (const item of needLLM) {
      const llmTag = await tagByLLM(item.title);
      if (llmTag) {
        applyTag(item, llmTag, 'llm');
        llmCount++;
      } else {
        applyTag(item, DEFAULT_TAG, 'default');
        defaultCount++;
      }
    }
  } else {
    console.log(`  全部 ${keywordCount} 条均由关键词匹配完成，无需大模型`);
  }

  console.log(`  打标签完成: 关键词 ${keywordCount}, 大模型 ${llmCount}, 默认 ${defaultCount}`);
  return items;
}

// ======================== 工具函数 ========================
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ======================== 数据获取 ========================
function formatItem(item) {
  return {
    title: item.title || '无标题',
    link: item.link || '',
    pubDate: item.pubDate || item.pubdate || '',
    author: item.creator || item.author || item['dc:creator'] || '',
    content: stripHtml(item.content || item.contentSnippet || ''),
    source: item.source || '',
    hot_metric: item.hot_metric || '',
  };
}

async function fetchRSS(source) {
  try {
    const feed = await rssParser.parseURL(source.url);
    const items = (feed.items || []).map((item) =>
      formatItem({ ...item, source: source.name })
    );
    return {
      source: source.name,
      url: source.url,
      itemCount: items.length,
      items,
    };
  } catch (err) {
    return {
      source: source.name,
      url: source.url,
      error: err.message,
      items: [],
    };
  }
}

async function fetchAll() {
  const results = await Promise.allSettled(
    SOURCES.map((source) => fetchRSS(source))
  );

  const allResults = results.map((r, index) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      source: SOURCES[index].name,
      url: SOURCES[index].url,
      error: r.reason?.message || '未知错误',
      items: [],
    };
  });

  // 对标记了 enrich 的源，用 article-extractor 抓取完整正文
  for (let i = 0; i < SOURCES.length; i++) {
    if (SOURCES[i].enrich && allResults[i].items.length > 0) {
      console.log(`[${allResults[i].source}]`);
      allResults[i].items = await enrichWithArticleExtractor(allResults[i].items);
    }
  }

  // 给所有新闻打标签
  for (const result of allResults) {
    if (result.error || result.items.length === 0) continue;
    console.log(`[${result.source}] 打标签`);
    result.items = await tagItems(result.items);
  }

  return allResults;
}

module.exports = { fetchAll, SOURCES };
