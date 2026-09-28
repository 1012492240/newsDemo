# 新闻标签体系说明

本文档说明新闻打标签功能的标签映射关系，以及每个标签对应的关键词匹配数据。

## 一、打标签流程

新闻打标签分三级，按优先级从高到低：

1. **关键词匹配**（`tagger.js`）：标题命中下方关键词表中的任一关键词，直接归入对应行业
2. **大模型识别**（`llm-tagger.js`）：关键词未匹配上时，调用 DeepSeek API 根据标题判断行业
3. **兜底标签**：以上都失败时，标记为「综合」

每条新闻打标签后会返回三个字段：

| 字段 | 说明 |
|------|------|
| `tag` | 中文标签名（如 `人工智能`） |
| `tagName` | 映射名（英文标识，如 `artificial-intelligence`） |
| `tagSource` | 打标签来源：`keyword`（关键词）/ `llm`（大模型）/ `default`（兜底） |

## 二、标签映射关系

| 标签（tag） | 映射名（name） |
|------------|---------------|
| 人工智能 | `artificial-intelligence` |
| 互联网 | `internet` |
| 硬件 | `hardware` |
| 软件 | `software` |
| 汽车 | `automobile` |
| 金融 | `finance` |
| 游戏 | `game` |
| 影视娱乐 | `entertainment` |
| 航天航空 | `aerospace` |
| 医疗健康 | `healthcare` |
| 教育 | `education` |
| 体育 | `sports` |
| 综合（兜底） | `general` |

## 三、关键词匹配数据

> 匹配规则：标题命中任一关键词即归入该标签；关键词匹配不区分大小写；标签顺序即匹配优先级（从上到下）。

### 1. 人工智能（`artificial-intelligence`）

```
AI、人工智能、大模型、LLM、GPT、ChatGPT、OpenAI、DeepSeek、Claude、
Gemini、文心一言、通义千问、智谱、机器学习、深度学习、神经网络、AIGC、
生成式、智能体、Agent、多模态、自然语言处理、NLP、计算机视觉、强化学习、
算力、GPU、模型训练、推理
```

### 2. 互联网（`internet`）

```
互联网、腾讯、阿里、百度、字节跳动、抖音、美团、拼多多、京东、快手、
网易、小红书、微信、微博、电商、直播、短视频、社交、搜索、云计算、
SaaS、App、APP、小程序
```

### 3. 硬件（`hardware`）

```
芯片、半导体、CPU、GPU、华为、苹果、iPhone、iPad、Mac、小米、OPPO、
vivo、三星、高通、英特尔、英伟达、NVIDIA、AMD、台积电、光刻机、手机、
电脑、笔记本、平板、耳机、手表、智能家居、智能硬件
```

### 4. 软件（`software`）

```
软件、操作系统、OS、Windows、Linux、macOS、iOS、Android、浏览器、数据库、
开源、GitHub、编程、代码、开发、程序员、编译器、框架、API
```

### 5. 汽车（`automobile`）

```
汽车、车企、新能源车、电动车、电动汽车、智能驾驶、自动驾驶、特斯拉、
比亚迪、蔚来、小鹏、理想、小米汽车、充电桩、电池、宁德时代、车型、
SUV、MPV、续航
```

### 6. 金融（`finance`）

```
金融、银行、证券、股票、股市、基金、投资、融资、IPO、上市、美元、人民币、
汇率、央行、美联储、利率、数字货币、比特币、加密、支付、保险、理财、债券
```

### 7. 游戏（`game`）

```
游戏、手游、网游、电竞、Steam、任天堂、Switch、PlayStation、PS5、Xbox、
英雄联盟、王者荣耀、原神、米哈游、腾讯游戏、网易游戏、游戏机、主机游戏、
独立游戏
```

### 8. 影视娱乐（`entertainment`）

```
电影、电视剧、剧集、综艺、演员、导演、票房、影视、娱乐圈、明星、音乐、
歌手、专辑、演唱会、动漫、动画
```

### 9. 航天航空（`aerospace`）

```
航天、航空、火箭、卫星、SpaceX、NASA、太空、飞船、空间站、登月、探月、
卫星发射、长征、星舰
```

### 10. 医疗健康（`healthcare`）

```
医疗、健康、医院、医药、药物、疫苗、疾病、癌症、基因、生物医药、医疗器械、
养生、体检、疫情
```

### 11. 教育（`education`）

```
教育、学校、学生、老师、高考、考研、大学、培训、课程、知识付费、在线教育
```

### 12. 体育（`sports`）

```
体育、足球、篮球、世界杯、奥运会、NBA、CBA、梅西、姆巴佩、C罗、马拉松、
比赛、球队、夺冠、联赛
```

## 四、返回 JSON 格式

### 单条新闻对象（item）

每条新闻经过抓取、补全正文、打标签后，最终包含以下字段：

```json
{
  "title": "派早报：OpenAI 称与苹果合作效果不佳",
  "link": "https://sspai.com/post/115079",
  "pubDate": "Mon, 28 Sep 2026 07:03:45 +0800",
  "author": "少数派编辑部",
  "content": "据 OpenAI 与 SpaceXAI 的反垄断案诉讼文件……",
  "source": "少数派",
  "hot_metric": "",
  "tag": "人工智能",
  "tagName": "artificial-intelligence",
  "tagSource": "keyword"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 新闻标题 |
| `link` | string | 原文链接 |
| `pubDate` | string | 发布时间 |
| `author` | string | 作者 |
| `content` | string | 正文内容（已去除 HTML 标签） |
| `source` | string | 数据源名称（如「少数派」「IT之家」） |
| `hot_metric` | string | 热度指标（仅部分源有，如知乎热榜） |
| `tag` | string | 中文标签名（如「人工智能」） |
| `tagName` | string | 标签映射名（英文标识，如 `artificial-intelligence`） |
| `tagSource` | string | 打标签来源：`keyword` / `llm` / `default` |

### 整体数据结构（数据源 → 新闻列表）

```json
[
  {
    "source": "少数派",
    "url": "https://sspai.com/feed",
    "itemCount": 10,
    "items": [
      {
        "title": "派早报：OpenAI 称与苹果合作效果不佳",
        "link": "https://sspai.com/post/115079",
        "pubDate": "Mon, 28 Sep 2026 07:03:45 +0800",
        "author": "少数派编辑部",
        "content": "……",
        "source": "少数派",
        "hot_metric": "",
        "tag": "人工智能",
        "tagName": "artificial-intelligence",
        "tagSource": "keyword"
      }
    ]
  }
]
```

### `tagSource` 取值含义

| 取值 | 说明 |
|------|------|
| `keyword` | 由关键词匹配命中 |
| `llm` | 由 DeepSeek 大模型识别 |
| `default` | 兜底，标记为「综合」 |

## 五、注意事项

- **关键词优先级**：`INDUSTRY_TAGS` 数组中排在前面的标签优先匹配。例如「华为」同时出现在「硬件」关键词里，但由于「硬件」在数组中位于「互联网」之前，实际会先命中「硬件」。
- **大小写不敏感**：匹配时会先将标题转为小写再比较，因此 `AI`、`ai`、`Ai` 都能命中。
- **大模型兜底**：需配置环境变量 `DEEPSEEK_API_KEY`（存放于项目根目录 `.env` 文件），否则关键词未匹配的新闻会直接落到「综合」。
