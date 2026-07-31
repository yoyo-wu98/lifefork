# LifeFork 分析方法、权重与来源规范

> 文档状态：当前实施基线
> 版本：Method & Provenance Spec v1.0
> 更新日期：2026-07-31
> 目标：让用户知道每条结论如何产生、能参考到什么程度、还缺少哪些信息。

## 1. 规范目标

LifeFork 同时使用用户材料、本地规则、群体研究、服务器 AI、阶段性格和传统文化方法。不同方法的证据强度差异很大。产品必须把差异写进数据模型和用户界面。

本规范解决：

1. 方法如何分类。
2. 权重如何归一化。
3. 参考度如何计算和表达。
4. 每条判断如何链接证据。
5. 每个人生分支如何说明来源。
6. 文化方法如何获得同意并限制使用。
7. 实际模型提供商如何记录。
8. 报告如何展示限制和技术来源。

## 2. 方法分类

### 2.1 用户材料

方法 ID：`user-evidence`

输入：

- 五问回答。
- 用户补充文本。
- 用户确认的人生节点。
- 微信记录本地摘要。
- 用户后续修改。

输出：

- 直接观察。
- 可引用证据。
- 当前目标和顾虑。
- 用户明确说过的价值偏好。

默认方法参考度：`0.86`

限制：

- 用户材料可能不完整。
- 回忆会受到时间、情绪和选择性表达影响。
- 第三方描述不能直接当作用户事实。

### 2.2 行为与决策模式

方法 ID：`behavioral-pattern`

输入：

- 多处重复出现的选择方式。
- 情绪触发条件。
- 风险处理方式。
- 行动与延迟模式。
- 关系边界和资源限制。

输出：

- 需要用户确认的重复模式。
- 可能的决策倾向。
- 当前冲突结构。

默认方法参考度：`0.68`

限制：

- 少量文本容易产生过度归纳。
- 模式描述不能转换为人格诊断。
- 单次事件不足以形成稳定模式。

### 2.3 群体统计参考

方法 ID：`population-statistics`

输入：

- 公开研究。
- 样本、测量方式和适用人群。
- 后续接入的行业、地区、年龄和行为基准。

当前输出：

- 通用风险检查。
- 群体层面相关性说明。
- 明确提示当前未接入个体化统计数据集。

默认方法参考度：`0.58`

限制：

- 群体相关性不能证明个体因果。
- 群体比例不能直接转成用户成功率。
- 缺少样本说明的数字禁止进入报告。

当前参考：

- [Big Five 与生活结果的元分析综述](https://pmc.ncbi.nlm.nih.gov/articles/PMC8867745/)

### 2.4 AI 综合分析

方法 ID：`ai-synthesis`

输入：

- 有界用户材料。
- 当前问题。
- 时间线摘要。
- 微信本地摘要。
- 预定义系统提示词。

输出：

- 结构化个人分析。
- 主要判断。
- 时间线候选节点。
- 可比较方案。
- 分支模拟对话。

默认方法参考度：`0.56`

限制：

- 模型可能生成合理但未经证实的内容。
- 模型输出必须通过 schema 校验。
- 关键判断需要回到用户材料。
- 提供商失败后需要降级。

运行记录必须包含：

```ts
interface AIExecutionMeta {
  used: boolean;
  provider: "openai" | "deepseek" | "local";
  model: string;
  fallbackReason?: string;
}
```

提供商来源：

- [OpenAI Models](https://developers.openai.com/api/docs/models)
- [OpenAI API 数据控制](https://developers.openai.com/api/docs/guides/your-data)
- [DeepSeek API 文档](https://api-docs.deepseek.com/)

OpenAI Responses API 请求设置 `store: false`。DeepSeek 部署需要单独核对测试协议和数据政策。

### 2.5 阶段性 MBTI 倾向

方法 ID：`mbti-stage`

输入：

- 当前表达和行动偏好。
- 过去阶段描述。
- 当前压力和角色。
- 未来情景假设。
- 用户修改。

输出：

- 每个人生阶段的四字母倾向。
- 每个阶段的参考度。
- 回顾材料或情景来源。
- 可能导致变化的因素。

默认方法参考度：`0.50`

强制语义：

- 使用“倾向”。
- 表明人生阶段。
- 允许用户不同意。
- 说明测评不是官方量表。
- 不用于招聘、筛选、能力判断或关系决定。

参考：

- [MBTI 官方使用伦理规范](https://www.myersbriggs.org/using-type-as-a-professional/mbti-code-of-ethics/home.htm)

### 2.6 八字文化解读

方法 ID：`bazi`

输入：

- 公历或农历。
- 出生日期。
- 出生时间。
- 时间准确度。
- 用户处理同意。

计算：

- 四柱。
- 日主。
- 五行。
- 十神。
- 命宫和身宫。

默认方法参考度：`0.32`

技术实现：

- [lunar-typescript](https://github.com/6tail/lunar-typescript)

限制：

- 结果属于传统文化规则。
- 技术库用于排盘，不能证明个人预测有效性。
- 不进入医疗、财务、职业或关系决定。
- 时间准确度不足时停止计算。

### 2.7 紫微斗数文化解读

方法 ID：`ziwei`

输入：

- 公历或农历。
- 出生日期。
- 出生时辰。
- 排盘性别规则。
- 用户处理同意。

计算：

- 命宫。
- 官禄、财帛、夫妻和迁移宫主星。
- 生肖。
- 星座。
- 农历和时辰区间。

默认方法参考度：`0.30`

技术实现：

- [iztro](https://github.com/SylarLong/iztro)

限制：

- 结果属于传统文化规则。
- 性别字段只用于当前排盘库的顺逆规则。
- 技术库用于生成排盘字段，不能证明个人预测有效性。
- 出生时间未知时停止计算。

## 3. 用户权重

### 3.1 原始权重

每个方法保存 `0-100` 的原始权重。用户可以关闭方法；关闭后该方法权重不参与计算。

### 3.2 归一化

对所有启用且权重大于零的方法：

```text
normalizedWeight(method)
  = rawWeight(method)
  / sum(rawWeight(enabled methods))
  * 100
```

显示精度为一位小数。

### 3.3 预设

#### 证据优先

```text
用户材料 35
行为模式 20
群体统计 12
AI 综合 15
阶段 MBTI 13
八字 3，默认关闭
紫微 2，默认关闭
```

#### 综合分析

```text
用户材料 25
行为模式 15
群体统计 10
AI 综合 20
阶段 MBTI 15
八字 8
紫微 7
```

#### 文化探索

```text
用户材料 20
行为模式 12
群体统计 8
AI 综合 15
阶段 MBTI 10
八字 18
紫微 17
```

文化探索中，现实材料、行为、统计、AI 和阶段性格的总权重仍高于两项文化方法总和。

## 4. 参考度与贡献

### 4.1 方法参考度

方法参考度由以下因素决定：

- 输入是否完整。
- 是否存在直接材料。
- 是否调用了服务器模型。
- 出生时间是否准确。
- 结论是否来自回顾材料或未来情景。

### 4.2 综合贡献

```text
contribution
  = normalizedWeight
  * methodConfidence
```

实现中保存为：

```ts
interface MethodContribution {
  methodId: AnalysisMethodId;
  methodLabel: string;
  category: AnalysisMethodCategory;
  userWeight: number;
  confidence: number;
  contribution: number;
  evidenceIds: string[];
  rationale: string;
  limitation: string;
}
```

综合贡献只用于解释排序。界面禁止使用“准确率”标签。

### 4.3 判断参考度

判断参考度来自：

- 用户材料覆盖程度。
- 规则或模型输出置信字段。
- 方法限制。
- 用户确认状态。

当前 V0.8 没有完成概率校准，因此参考度不能解释为统计概率。

## 5. 材料完整度

当前计算包含：

- 证据条数。
- 主要判断条数。
- 补充材料长度。
- 启用方法数量。

示意：

```text
completeness
  = base
  + evidence coverage
  + bounded material coverage
  + small method coverage factor
```

用途：

- 提醒用户当前报告依赖多少材料。
- 判断是否需要补充信息。

禁止用途：

- 宣称预测准确。
- 宣称用户画像完成。
- 与其他用户排名。

## 6. 证据链接

每条可验证判断必须保存 `evidenceIds`：

```ts
interface Evidence {
  id: string;
  source: "question" | "extra_text" | "wechat" | "generated";
  quote: string;
}

interface Claim {
  id: string;
  text: string;
  confidence: number;
  evidenceIds: string[];
  methodContributions?: MethodContribution[];
}
```

规则：

1. 直接用户判断至少链接一条 `question`、`extra_text` 或 `wechat` 证据。
2. `generated` 不能作为唯一事实依据。
3. 界面引用必须限制长度。
4. 分享卡默认不包含引用原文。
5. 删除材料后，相关判断需要重新计算或降级。

## 7. 分支来源

每个 `ForkPath` 对应一份 `BranchMethodExplanation`：

```ts
interface BranchMethodExplanation {
  branchId: string;
  branchTitle: string;
  score: number;
  summary: string;
  methodContributions: MethodContribution[];
  assumptions: string[];
  unknowns: string[];
}
```

当前分支参考分基于：

- 用户权重。
- 方法参考度。
- 当前目标和顾虑。
- 分支收益与成本。
- 节点顺序的小幅排序因素。

当前分支参考分不包含：

- 个体成功概率。
- 实时行业数据。
- 宏观经济预测。
- 医疗、财务或关系结果概率。

每个顶层和深层节点都必须生成来源说明。场景树遍历上限为 200 个节点。

## 8. 报告展示顺序

### 8.1 判断

```text
判断标题
参考度
判断内容
展开：
  方法名称
  用户权重
  方法参考度
  综合贡献
  采用理由
  方法限制
  对应用户材料
```

### 8.2 方法表

列：

- 方法。
- 类型。
- 用户权重。
- 状态。
- 本次结果。
- 明细和限制。

状态：

- `complete`
- `limited`
- `disabled`
- `missing-input`

### 8.3 文化内容

文化结果：

- 使用金色“文化解读”标签。
- 显示低参考度。
- 显示排盘技术来源。
- 显示“技术实现不证明预测有效性”。
- 与用户事实和 AI 判断分开。

## 9. 数据处理路径

### 9.1 AI

```text
浏览器
  -> LifeFork API
  -> 请求校验与截断
  -> 匿名安全标识
  -> 模型提供商
  -> JSON schema 校验
  -> 本地默认值合并
  -> 浏览器保存
```

### 9.2 文化排盘

```text
浏览器出生信息
  -> LifeFork API
  -> 同意与字段校验
  -> lunar-typescript / iztro
  -> 结构化排盘结果
  -> 浏览器保存
```

出生字段不进入 AI prompt。

### 9.3 微信

```text
微信导出文本
  -> 浏览器有界解析
  -> 基础脱敏
  -> 主题、情绪、关键片段
  -> 短摘要
  -> Self Skill 生成请求
```

## 10. 质量门槛

### 10.1 方法正确性

- 归一化权重总和允许 `99.9%-100.1%` 浮点误差。
- 关闭方法后显示权重 `0%`。
- 证据优先必须关闭文化方法。
- 综合分析和文化探索必须要求出生字段。
- 实际 AI 提供商必须与报告一致。
- AI 降级后报告显示本地规则和降级原因。

### 10.2 文化方法

- 公历和农历至少各有一组固定 fixture。
- 准确时间和两小时误差各有一组 fixture。
- 未知出生时间返回 `missing-input`。
- 未同意处理返回 `missing-input`。
- 紫微缺少排盘性别规则返回 `missing-input`。
- 生肖和星座字段必须来自排盘库。

### 10.3 报告

- 每条主要判断能展开。
- 每个分支能显示方法来源。
- 方法来源链接可以访问。
- 文化限制在首屏或一次展开内可见。
- 没有“准确率”“必然”“一定会”等词。

## 11. 已知限制

1. 当前参考度没有通过真实用户数据校准。
2. 群体统计模块尚未接入结构化数据集。
3. MBTI 倾向来自文本规则，不能替代正式测评。
4. 文化方法只完成规则排盘，没有建立预测验证。
5. 分支参考分用于相对比较，不能跨用户比较。
6. AI 提供商的数据保留政策需要由部署方单独审核。

## 12. 后续演进

### 0.9

- 建立 `DatasetRegistry`，每个统计结论绑定数据集、样本、时间和适用范围。
- 增加用户“同意、部分同意、不同意”反馈。
- 记录判断修改前后差异。
- 为参考度建立离线校准集。

### 1.0

- 把分析方法注册为插件。
- 支持新增方法独立部署和版本控制。
- 对报告生成进行可重复回放。
- 建立分支结果的长期用户反馈闭环。
- 支持用户选择完全关闭所有远程模型。
