// ======================== 行业标签配置 ========================
// 每个行业包含：
//   tag: 中文标签名
//   name: 映射名（英文标识，用于系统间交互/数据库存储）
//   keywords: 关键词列表，标题命中任一关键词即归入该行业
// 顺序很重要：匹配优先级从上到下
const INDUSTRY_TAGS = [
  {
    tag: '人工智能',
    name: 'artificial-intelligence',
    keywords: [
      'AI', '人工智能', '大模型', 'LLM', 'GPT', 'ChatGPT', 'OpenAI',
      'DeepSeek', 'Claude', 'Gemini', '文心一言', '通义千问', '智谱',
      '机器学习', '深度学习', '神经网络', 'AIGC', '生成式', '智能体',
      'Agent', '多模态', '自然语言处理', 'NLP', '计算机视觉', '强化学习',
      '算力', 'GPU', '模型训练', '推理',
    ],
  },
  {
    tag: '互联网',
    name: 'internet',
    keywords: [
      '互联网', '腾讯', '阿里', '百度', '字节跳动', '抖音', '美团',
      '拼多多', '京东', '快手', '网易', '小红书', '微信', '微博',
      '电商', '直播', '短视频', '社交', '搜索', '云计算', 'SaaS',
      'App', 'APP', '小程序',
    ],
  },
  {
    tag: '硬件',
    name: 'hardware',
    keywords: [
      '芯片', '半导体', 'CPU', 'GPU', '华为', '苹果', 'iPhone', 'iPad',
      'Mac', '小米', 'OPPO', 'vivo', '三星', '高通', '英特尔', '英伟达',
      'NVIDIA', 'AMD', '台积电', '光刻机', '手机', '电脑', '笔记本',
      '平板', '耳机', '手表', '智能家居', '智能硬件',
    ],
  },
  {
    tag: '软件',
    name: 'software',
    keywords: [
      '软件', '操作系统', 'OS', 'Windows', 'Linux', 'macOS', 'iOS',
      'Android', '浏览器', '数据库', '开源', 'GitHub', '编程', '代码',
      '开发', '程序员', '编译器', '框架', 'API',
    ],
  },
  {
    tag: '汽车',
    name: 'automobile',
    keywords: [
      '汽车', '车企', '新能源车', '电动车', '电动汽车', '智能驾驶',
      '自动驾驶', '特斯拉', '比亚迪', '蔚来', '小鹏', '理想', '小米汽车',
      '充电桩', '电池', '宁德时代', '车型', 'SUV', 'MPV', '续航',
    ],
  },
  {
    tag: '金融',
    name: 'finance',
    keywords: [
      '金融', '银行', '证券', '股票', '股市', '基金', '投资', '融资',
      'IPO', '上市', '美元', '人民币', '汇率', '央行', '美联储', '利率',
      '数字货币', '比特币', '加密', '支付', '保险', '理财', '债券',
    ],
  },
  {
    tag: '游戏',
    name: 'game',
    keywords: [
      '游戏', '手游', '网游', '电竞', 'Steam', '任天堂', 'Switch',
      'PlayStation', 'PS5', 'Xbox', '英雄联盟', '王者荣耀', '原神',
      '米哈游', '腾讯游戏', '网易游戏', '游戏机', '主机游戏', '独立游戏',
    ],
  },
  {
    tag: '影视娱乐',
    name: 'entertainment',
    keywords: [
      '电影', '电视剧', '剧集', '综艺', '演员', '导演', '票房', '影视',
      '娱乐圈', '明星', '音乐', '歌手', '专辑', '演唱会', '动漫', '动画',
    ],
  },
  {
    tag: '航天航空',
    name: 'aerospace',
    keywords: [
      '航天', '航空', '火箭', '卫星', 'SpaceX', 'NASA', '太空', '飞船',
      '空间站', '登月', '探月', '卫星发射', '长征', '星舰',
    ],
  },
  {
    tag: '医疗健康',
    name: 'healthcare',
    keywords: [
      '医疗', '健康', '医院', '医药', '药物', '疫苗', '疾病', '癌症',
      '基因', '生物医药', '医疗器械', '养生', '体检', '疫情',
    ],
  },
  {
    tag: '教育',
    name: 'education',
    keywords: [
      '教育', '学校', '学生', '老师', '高考', '考研', '大学', '培训',
      '课程', '知识付费', '在线教育',
    ],
  },
  {
    tag: '体育',
    name: 'sports',
    keywords: [
      '体育', '足球', '篮球', '世界杯', '奥运会', 'NBA', 'CBA', '梅西',
      '姆巴佩', 'C罗', '马拉松', '比赛', '球队', '夺冠', '联赛',
    ],
  },
];

// 默认标签（大模型也未识别到时兜底）
const DEFAULT_TAG = {
  tag: '综合',
  name: 'general',
};

// 标签名 -> 完整标签对象 的映射表
const TAG_MAP = {};
for (const industry of INDUSTRY_TAGS) {
  TAG_MAP[industry.tag] = industry;
}
TAG_MAP[DEFAULT_TAG.tag] = DEFAULT_TAG;

// ======================== 关键词匹配打标签 ========================
// 返回完整标签对象 { tag, name }，未匹配返回 null
function matchByKeywords(title) {
  if (!title) return null;
  const lowerTitle = title.toLowerCase();

  for (const industry of INDUSTRY_TAGS) {
    for (const kw of industry.keywords) {
      if (lowerTitle.includes(kw.toLowerCase())) {
        return { tag: industry.tag, name: industry.name };
      }
    }
  }
  return null;
}

// 根据标签名获取映射 name（找不到返回空字符串）
function getTagName(tag) {
  return TAG_MAP[tag] ? TAG_MAP[tag].name : '';
}

module.exports = {
  INDUSTRY_TAGS,
  DEFAULT_TAG,
  TAG_MAP,
  matchByKeywords,
  getTagName,
};
