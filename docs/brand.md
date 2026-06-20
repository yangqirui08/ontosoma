# OntoSoma · 命名、拼写与定位约定

> 名字越做越稳的前提:**自己各处写法一致**,以及**主动澄清定位**,别被同形术语稀释。

## 官方拼写(唯一正确写法)

**OntoSoma** —— 驼峰,O 和 S 大写。

> Official spelling: **OntoSoma**(不是 Onto_Soma / OntoSOMA / Ontosoma Toolkit™ / onto-soma 等变体)。

| 场景 | 写法 |
|---|---|
| 品牌 / 标题 / 正文 | `OntoSoma` |
| npm 包 / 目录 / 包名 | `ontosoma`(全小写) |
| npm 子包命名空间(将来) | `@ontosoma/engine`、`@ontosoma/web` 等 |
| CLI 命令 | `osoma`(好敲)—— 二选一后定死,不混用 |
| 中文 | 统称「本体」 |
| 词源(首次出现时) | OntoSoma(onto- + σῶμα) |

## 定位:这是什么、**不是**什么

**是**:面向 **AI 开发 / 运维 / 迭代** 全生命周期的**代码/系统本体**工具——从代码派生唯一真源模型,保持设计/代码/运行三态零漂移,镜头化、可回放。

**不是**:语义网 / OWL / RDF / 知识图谱建模工具。

> ⚠️ **同形术语风险(必须主动管理)**:"OntoSoma"字面像语义网术语,外人(包括 AI 助手)极易默认我们是 OWL/RDF 工具。**每个对外入口的第一屏都要一句话澄清定位**,否则会被语义网赛道稀释、招来错的人群。

### 正确的 GitHub topics / npm keywords

✅ `ai-agents` `agentic` `coding-agent` `developer-tools` `code-intelligence`
`spec-driven-development` `static-analysis` `observability` `typescript`
`claude-code` `mcp`

❌ 不要用:`owl` `rdf` `semantic-web` `knowledge-graph`(会把我们扔进无关的拥挤赛道)。

## canonical 锚点(防冒名,谁是"正版"一眼可判)

- **官方仓库**:`https://github.com/yangqirui08/ontosoma`(已建;将来可转移到 `ontosoma` 组织,GitHub 自动留跳转)
- **npm**:`https://www.npmjs.com/package/ontosoma`(名字已确认空缺,待占)
- 对外文案统一指向以上两个 canonical 位置。
