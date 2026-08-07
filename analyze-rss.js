const { fetchAll } = require('./fetcher');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('正在抓取所有 RSS 源数据...\n');
  const results = await fetchAll();

  const report = [];

  // 分类统计
  const hasContent = [];      // 有正文
  const onlyLink = [];        // 只有链接，无正文
  const noContent = [];       // 完全没内容字段
  const failed = [];          // 抓取失败

  for (const result of results) {
    if (result.error) {
      failed.push(result);
      continue;
    }

    const items = result.items || [];
    let withContent = 0;
    let withoutContent = 0;
    let contentSample = '';
    let noContentSample = '';

    for (const item of items) {
      if (item.content && item.content.length > 10) {
        withContent++;
        if (!contentSample) {
          contentSample = item.content.substring(0, 150);
        }
      } else {
        withoutContent++;
        if (!noContentSample) {
          noContentSample = item.title || '(无标题)';
        }
      }
    }

    const total = withContent + withoutContent;
    const pct = total > 0 ? Math.round((withContent / total) * 100) : 0;

    if (withoutContent === total) {
      onlyLink.push({ ...result, total, contentSample: noContentSample });
    } else if (withContent === total) {
      hasContent.push({ ...result, total, contentSample, pct });
    } else {
      // 部分有、部分没有
      hasContent.push({ ...result, total, withContent, withoutContent, contentSample, noContentSample, pct });
    }
  }

  // ======================== 生成报告 ========================
  const lines = [];
  const now = new Date().toLocaleString('zh-CN');

  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║        RSS 源正文覆盖率分析报告                          ║');
  lines.push(`║        生成时间: ${now}                  ║`);
  lines.push('╚══════════════════════════════════════════════════════════╝');
  lines.push('');

  // ---- 摘要 ----
  lines.push('┌──────────────────────────────────────────────────────────┐');
  lines.push('│  摘要                                                    │');
  lines.push('├──────────────────────────────────────────────────────────┤');
  lines.push(`│  总共 ${results.length} 个数据源                                  │`);
  lines.push(`│  ✅ 有正文: ${hasContent.length} 个源                                   │`);
  lines.push(`│  ❌ 仅链接/无正文: ${onlyLink.length} 个源                              │`);
  lines.push(`│  ⛔ 抓取失败: ${failed.length} 个源                                   │`);
  lines.push('└──────────────────────────────────────────────────────────┘');
  lines.push('');

  // ---- 仅链接、无正文 ----
  if (onlyLink.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('❌ 以下 RSS 源【只返回链接，没有正文内容】');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    for (const src of onlyLink) {
      lines.push(`  📌 ${src.source}`);
      lines.push(`      URL: ${src.url}`);
      lines.push(`      条目数: ${src.total}`);
      lines.push(`      原因: content 字段为空或仅含极短文本`);
      lines.push(`      示例条目: "${src.contentSample}"`);
      lines.push('');
    }
  }

  // ---- 有正文 ----
  if (hasContent.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('✅ 以下 RSS 源【包含正文内容】');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    for (const src of hasContent) {
      lines.push(`  📌 ${src.source}`);
      lines.push(`      URL: ${src.url}`);
      lines.push(`      条目数: ${src.total}`);
      if (src.withoutContent !== undefined) {
        lines.push(`      有正文: ${src.withContent} 条 / 无正文: ${src.withoutContent} 条 (${src.pct}%)`);
      } else {
        lines.push(`      覆盖率: ${src.pct}%`);
      }
      if (src.contentSample) {
        const sample = src.contentSample.length > 120 ? src.contentSample.substring(0, 120) + '...' : src.contentSample;
        lines.push(`      正文示例: "${sample}"`);
      }
      lines.push('');
    }
  }

  // ---- 抓取失败 ----
  if (failed.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('⛔ 以下 RSS 源【抓取失败】');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    for (const src of failed) {
      lines.push(`  📌 ${src.source}`);
      lines.push(`      URL: ${src.url}`);
      lines.push(`      错误: ${src.error}`);
      lines.push('');
    }
  }

  // ---- 结论 ----
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('📋 总结');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  if (onlyLink.length > 0) {
    lines.push(`  仅返回链接、无正文的源 (${onlyLink.length} 个):`);
    for (const src of onlyLink) {
      lines.push(`    - ${src.source}`);
    }
    lines.push('');
    lines.push('  原因分析:');
    lines.push('    1. 知乎热榜: API 返回的是问题摘要(excerpt)，不是完整回答，正文为空');
    lines.push('    2. 某些 RSS 源只提供 title + link，不提供 content/contentSnippet');
    lines.push('    3. 这些源需要二次抓取链接才能获得正文，但因反爬限制很难实现');
    lines.push('');
  }

  if (hasContent.length > 0) {
    lines.push(`  包含正文的源 (${hasContent.length} 个):`);
    for (const src of hasContent) {
      lines.push(`    - ${src.source}`);
    }
    lines.push('');
  }

  // 写入文件
  const outputPath = path.join(__dirname, 'rss-analysis-report.txt');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  console.log(`\n📄 分析报告已写入: ${outputPath}`);

  // 同时打印到控制台
  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error('分析出错:', err);
  process.exit(1);
});
