require('dotenv').config();

const axios = require('axios');
const { INDUSTRY_TAGS, DEFAULT_TAG, TAG_MAP } = require('./tagger');

// DeepSeek API 配置
// 通过环境变量 DEEPSEEK_API_KEY 配置，避免硬编码密钥
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const TAG_LIST = INDUSTRY_TAGS.map((t) => t.tag);

/**
 * 调用 DeepSeek 大模型，根据标题识别行业标签
 * @param {string} title 新闻标题
 * @returns {Promise<object|null>} 标签对象 { tag, name }，失败返回 null
 */
async function tagByLLM(title) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null; // 未配置 key 时返回 null，走默认标签
  }

  const prompt = `你是一个新闻分类助手。请根据新闻标题判断它属于哪个行业类别。

可选类别（必须从下面选择一个）：
${TAG_LIST.join('、')}

新闻标题：${title}

要求：
1. 只输出一个类别名称，不要输出任何其他文字、标点或解释。
2. 如果无法判断，输出「综合」。

类别：`;

  try {
    const res = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 16,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 20000,
      }
    );

    const content = res.data?.choices?.[0]?.message?.content || '';
    const tag = content.trim().replace(/[。，、.\s]/g, '');

    // 校验返回的标签是否在可选列表内
    if (TAG_LIST.includes(tag)) {
      return { tag, name: TAG_MAP[tag].name };
    }
    return { tag: DEFAULT_TAG.tag, name: DEFAULT_TAG.name };
  } catch (err) {
    console.error(`    [DeepSeek 打标签失败] ${err.message}`);
    return null;
  }
}

module.exports = { tagByLLM, TAG_LIST };
