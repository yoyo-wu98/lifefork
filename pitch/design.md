# LifeFork 路演 PPT 视觉设计

## 1. Profile 基线声明
- **Profile**: `profiles/strategic.md`（融资路演场景）。
- **参考维度**: 叙事框架（问题→方案→产品→创新→信任→市场→模式→竞争→路线图→CTA）、大数字表达、对比矩阵、里程碑路线图、克制高级感、锐角矩形、装饰禁令。
- **偏离说明**: 色彩不采用常见深蓝商务风，而是沿用产品自有设计系统（纸面中性色 + 墨色 + 深地图色），与品牌"清楚、可靠、克制"一致；标题用宋体（siyuanSongti）营造编辑感而非纯无衬线商务风。

## 2. 风格基线声明
- **风格锚点**: Kinfolk / Monocle 杂志编辑风（大留白、宋体标题、细线、克制配色）× 产品自身"夜晚书桌上的档案与地图"美学。
- **参考维度**: 版面编辑感与字号对比取自杂志风；配色与"浅色工作区 + 深色人生地图"双环境取自产品 DESIGN.md。

## 3. 风格细节
### 色彩
- 倾向：稳重为底、局部点亮。温度：暖纸面 + 冷墨蓝，矿物感。
- 浅色页（内容页）：纸面背景 `#F7F4EE`，墨色正文 `#232A3D`，辅助灰蓝 `#6B7186`，细线 `#D8D5CC`。
- 深色页（封面/创新二/市场/结尾）：地图底色 `#1D2333`，文字 `#EDEAE2`，辅助 `#9BA3B5`。
- 强调色：琥珀金 `#B08A3E`（焦点、关键数字、kicker），分支紫 `#7B5EA7` 与焦点蓝 `#3D5A99` 仅用于分支/路径语义。禁用高饱和荧光色与廉价渐变。

### 字体
- 标题：siyuanSongti（宋体，编辑感），封面 60-64px，页标题 30-32px。
- 正文：MiSans，18-20px，行高 1.5；辅助文字 14-15px；脚注 11-12px。
- 大数字/英文：Liter（拉丁）+ MiSans，44-56px。
- kicker：Liter+MiSans 13px，全大写英文+中文，letterSpacing 4，琥珀金。

### 容器与装饰
- 锐角矩形、细边框（1px `#D8D5CC`）或无边框+留白分区；禁用圆角卡片堆叠、阴影堆叠、渐变光晕。
- 装饰元素：细分叉线图（人生路径母题）、金色短下划线（标题下 44×3）、节点小圆点。

### 图表与表格
- 图表：扁平单色系（金/墨蓝），深色页用金；隐藏多余网格线；数据标签直接显示。
- 表格：三线表感，表头墨色底纸色字，LifeFork 列用淡金底 `#F0E8D8` 强调；●/◐/— 符号表达能力强弱。

## 4. 布局系统
- 画布 1280×720，页边距 80px。浅色内容页统一：kicker(80,50) → 标题(80,78,32px) → 金色短下划线(80,134) → 内容区 y160-660 → 页脚(左品牌右页码, y686, 11px)。
- 网格：三栏 w=352 gap=32（x=80/464/848）；四栏 w=263 gap=24（x=80/367/654/941）；左右分栏 左560/右520-640。
- 深色页打破节奏：封面/结尾用分叉路径图 + 超大宋体；市场页左图右大数字。
- 禁止：左右栏底边不齐、内容集中上半页、纯标题+几行字的空页。

## 5. 样式使用规则
- `$kicker` 仅用于页眉标签；`$title`/`$titleDark` 页标题；`$body` 正文；`$small` 辅助说明；`$number` 大数字。
- 金色仅用于 kicker、关键数字、强调短句、分叉主线；紫/蓝仅用于分支语义与次要路径。

## 6. 风险禁令（本片最易违反项）
- 禁止蓝紫科技风渐变、发光、毛玻璃（产品明令禁止，且显廉价）。
- 正文字号不得低于 14px（辅助）/ 18px（正文）；页标题不低于 28px；脚注不低于 11px。
- 单行文本框必须 `wrap: false` 并按 字号×1.3 预留高度。
- 深色页文字必须用 `$mapText` 而非纯白（产品禁止纯白）。
- 分叉线条装饰不得穿过任何文本框。

## 7. Theme 定义
```yaml
theme:
  colors:
    paper: "#F7F4EE"
    paperRaised: "#FCFAF6"
    ink: "#232A3D"
    muted: "#6B7186"
    faint: "#9AA0B0"
    line: "#D8D5CC"
    gold: "#B08A3E"
    goldSoft: "#F0E8D8"
    violet: "#7B5EA7"
    blue: "#3D5A99"
    map: "#1D2333"
    mapDeep: "#161B29"
    mapLine: "#3A4358"
    mapText: "#EDEAE2"
    mapMuted: "#9BA3B5"
  textStyles:
    kicker:
      fontSize: 13
      color: "$gold"
      fontFamily: "Liter, MiSans"
      letterSpacing: 4
    title:
      fontSize: 32
      color: "$ink"
      fontFamily: "siyuanSongti"
    titleDark:
      fontSize: 32
      color: "$mapText"
      fontFamily: "siyuanSongti"
    body:
      fontSize: 18
      color: "$ink"
      fontFamily: "MiSans"
      lineHeight: 1.5
    small:
      fontSize: 14
      color: "$muted"
      fontFamily: "MiSans"
      lineHeight: 1.45
    number:
      fontSize: 52
      color: "$ink"
      fontFamily: "Liter, MiSans"
  tableStyles:
    default:
      headerFill: "$ink"
      headerColor: "#F7F4EE"
      headerBold: true
      bodyFill: ["#FCFAF6", "#F3EFE6"]
      bodyColor: "$ink"
      border:
        style: solid
        width: 1
        color: "$line"
```
