const Parser = require('rss-parser');
const axios = require('axios');

const rssParser = new Parser();

// ======================== 数据源配置 ========================
const SOURCES = [
  { name: '36氪', url: 'https://36kr.com/feed' },
  { name: '少数派', url: 'https://sspai.com/feed' },
  { name: 'IT之家', url: 'https://www.ithome.com/rss/' },
  { name: '极客公园', url: 'https://mainssl.geekpark.net/rss.rss' },
  { name: '爱范儿', url: 'https://www.ifanr.com/feed' },
  { name: '雷锋网', url: 'https://www.leiphone.com/feed/' },
  {
    name: '知乎热榜',
    url: 'https://api.zhihu.com/topstory/hot-lists/total?limit=30',
    type: 'json_api',
    transform: 'zhihu_hotlist',
  },
  { name: '央视新闻', url: 'https://rsshub.rssforever.com/cctv/world' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
];

// ======================== 知乎热榜数据变换 ========================
function transformZhihuHotlist(data) {
  const items = data.data || [];
  return items.map((item) => {
    const target = item.target || {};
    const questionId = target.id || '';
    const link = questionId
      ? `https://www.zhihu.com/question/${questionId}`
      : '';
    return {
      title: target.title || item.detail_text || '',
      link,
      pubDate: new Date(parseInt(target.created) * 1000).toISOString(),
      content: target.excerpt || '',
      source: '知乎热榜',
      hot_metric: item.detail_text || '',
    };
  });
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
const TRANSFORMS = {
  zhihu_hotlist: transformZhihuHotlist,
};

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

async function fetchJSONApi(source) {
  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    let items = [];
    if (source.transform && TRANSFORMS[source.transform]) {
      items = TRANSFORMS[source.transform](response.data);
    } else {
      items = Array.isArray(response.data) ? response.data : [response.data];
    }

    return {
      source: source.name,
      url: source.url,
      itemCount: items.length,
      items: items.map((item) =>
        formatItem({ ...item, source: source.name })
      ),
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

async function fetchSource(source) {
  if (source.type === 'json_api') {
    return fetchJSONApi(source);
  }
  return fetchRSS(source);
}

async function fetchAll() {
  const results = await Promise.allSettled(
    SOURCES.map((source) => fetchSource(source))
  );

  return results.map((r, index) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      source: SOURCES[index].name,
      url: SOURCES[index].url,
      error: r.reason?.message || '未知错误',
      items: [],
    };
  });
}

module.exports = { fetchAll, SOURCES };
