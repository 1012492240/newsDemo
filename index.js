const { fetchAll } = require('./fetcher');
const { TAG_MAP } = require('./tagger');
const fs = require('fs');
const path = require('path');

/**
 * 格式化输出单条新闻
 */
function formatItemLines(item, index) {
  const lines = [];
  lines.push(`    ${String(index + 1).padStart(2, '0')}. ${item.title}`);
  if (item.pubDate) {
    lines.push(`        日期: ${item.pubDate}`);
  }
  if (item.author) {
    lines.push(`        作者: ${item.author}`);
  }
  if (item.hot_metric) {
    lines.push(`        热度: ${item.hot_metric}`);
  }
  if (item.link) {
    lines.push(`        链接: ${item.link}`);
  }
  if (item.content) {
    lines.push(`        内容: ${item.content}`);
  }
  return lines;
}

/**
 * 格式化输出所有新闻数据，写入文件
 */
async function main() {
  console.log('开始获取新闻数据...');

  const results = await fetchAll();

  let totalItems = 0;
  const lines = [];

  lines.push('======================================================================');
  lines.push(`  新闻聚合数据 - 生成时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push('======================================================================');

  // ======================== 按标签分组 ========================
  // grouped: { [tag]: [items...] }
  const grouped = {};
  for (const result of results) {
    if (result.error) continue;
    for (const item of result.items || []) {
      const tag = item.tag || '综合';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(item);
      totalItems++;
    }
  }

  // 按标签名排序（保持标签配置里的顺序，未知标签放最后）
  const orderedTags = Object.keys(grouped).sort((a, b) => {
    const aKnown = TAG_MAP[a] ? 0 : 1;
    const bKnown = TAG_MAP[b] ? 0 : 1;
    if (aKnown !== bKnown) return aKnown - bKnown;
    return a.localeCompare(b, 'zh-CN');
  });

  // ======================== 汇总统计 ========================
  lines.push('');
  lines.push('----------------------------------------------------------------------');
  lines.push('  标签统计');
  lines.push('----------------------------------------------------------------------');
  for (const tag of orderedTags) {
    const name = TAG_MAP[tag] ? TAG_MAP[tag].name : '';
    const count = grouped[tag].length;
    lines.push(`  ${tag} (${name || '-'}): ${count} 条`);
  }
  lines.push(`  合计: ${totalItems} 条`);
  lines.push('----------------------------------------------------------------------');

  // ======================== 按标签分组输出详情 ========================
  for (const tag of orderedTags) {
    const name = TAG_MAP[tag] ? TAG_MAP[tag].name : '';
    const items = grouped[tag];

    lines.push('');
    lines.push('======================================================================');
    lines.push(`【${tag}】${name ? ` (${name})` : ''} - 共 ${items.length} 条`);
    lines.push('======================================================================');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      lines.push(`  [${item.source}]`);
      lines.push(...formatItemLines(item, i));
      lines.push('');
    }
  }

  lines.push('======================================================================');
  lines.push(`共获取 ${results.length} 个数据源，${totalItems} 条新闻，${orderedTags.length} 个标签`);
  lines.push('======================================================================');

  // 写入文件
  const outputPath = path.join(__dirname, 'news-output.txt');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');

  console.log(`✅ 数据已写入: ${outputPath}`);
  console.log(`   共 ${results.length} 个数据源，${totalItems} 条新闻，${orderedTags.length} 个标签`);
}

main().catch((err) => {
  console.error('程序运行出错:', err);
  process.exit(1);
});
