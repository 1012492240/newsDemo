const { fetchAll } = require('./fetcher');
const fs = require('fs');
const path = require('path');

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

  for (const result of results) {
    lines.push('');
    lines.push('----------------------------------------------------------------------');
    lines.push(`【${result.source}】`);
    lines.push(`URL: ${result.url}`);

    if (result.error) {
      lines.push(`[错误] ${result.error}`);
      continue;
    }

    lines.push(`条目数: ${result.itemCount}`);
    lines.push('----------------------------------------------------------------------');

    const items = result.items || [];
    totalItems += items.length;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      lines.push(`  ${String(i + 1).padStart(2, '0')}. ${item.title}`);
      if (item.pubDate) {
        lines.push(`      日期: ${item.pubDate}`);
      }
      if (item.author) {
        lines.push(`      作者: ${item.author}`);
      }
      if (item.hot_metric) {
        lines.push(`      热度: ${item.hot_metric}`);
      }
      if (item.link) {
        lines.push(`      链接: ${item.link}`);
      }
      if (item.content) {
        lines.push(`      内容: ${item.content}`);
      }
    }
  }

  lines.push('');
  lines.push('======================================================================');
  lines.push(`共获取 ${results.length} 个数据源，${totalItems} 条新闻`);
  lines.push('======================================================================');

  // 写入文件
  const outputPath = path.join(__dirname, 'news-output.txt');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');

  console.log(`✅ 数据已写入: ${outputPath}`);
  console.log(`   共 ${results.length} 个数据源，${totalItems} 条新闻`);
}

main().catch((err) => {
  console.error('程序运行出错:', err);
  process.exit(1);
});
