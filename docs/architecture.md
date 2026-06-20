# OntoSoma · 架构与技术

> 本文是"怎么落地"。哲学见 [vision.md](vision.md);决策与理由见 [decisions.md](decisions.md)。

---

## 1. 三层结构(每层用对的技术)

OntoSoma 不是单一程序,而是三层,各用最合适的技术——这正是 superpowers/openspec 成熟之处:

| 层 | 职责 | 技术 |
|---|---|---|
| **方法论内容层** | 规则/流程:怎么设计、怎么跑闸、怎么查本体 | **Markdown(skills)+ AGENTS.md**,**描述动作、不点名工具** |
| **引擎 + web 层** | 派生器、规则闸、本体存储、可观测 web | **TypeScript(Node)**,编译走 `tsc`,零/极少依赖,解析用 **tree-sitter(WASM)** |
| **运行态 reporter 层** | 把运行 app 的真实状态上报本体 | **各目标 app 自己的语言的薄 SDK**,只发事件、不嵌逻辑 |

> **铁律(抄自 superpowers):内容层只说"dispatch 一个 subagent""读一个文件"这种动作,绝不写具体工具名。** 工具名隔离到一份 per-harness 映射表。这是跨工具可移植的真正原因。

---

## 2. 一个本体,三个投影,两条数据腿

```
                    ┌──────────────────────────────┐
                    │   本体 (单一规范模型)            │
                    │   设计态 · 代码态 · 运行态        │
                    │   = 提交进仓库的 lockfile        │
                    └──────────────────────────────┘
        ▲(静态派生)        ▲(设计输入)        ▲(运行上报)
   tree-sitter/AST     能力设计台          薄 SDK / sidecar
   [dev 这条腿]         [人 / AI]          [运行时这条腿]
                              │
        ┌─────────────────────┼─────────────────────┐
       闸(三态对账)        镜头(渲染)            时间轴(git)
                              │
                    web(观测 + 设计,读同一产物)
```

- **dev 这条腿(先做)**:静态派生代码 → 喂「代码态」;人/AI 在设计台改 → 喂「设计态」;闸做对账。本体得先存在。
- **运行时这条腿(后做)**:app 跑起来把真实状态上报 → 喂「运行态」。**模型从第一天就要留出运行态的位置**,否则后面回填很痛。

---

## 3. 派生器(derivation engine)

把代码"看穿"成本体节点 + 关系。

- **通用语法解析 = tree-sitter(WASM 版 web-tree-sitter)**:多语言事实标准,Node/浏览器都能跑,免本地编译,对"装上即用"友好。
- **深层语义按目标语言走 adapter**:深度分析本就该用目标语言自己的工具链(TS 用 TS Compiler API、Python 用 pyright/jedi 等)。宿主语言只是**编排者**,通过 adapter 接口 shell 调各语言分析器。
  - 推论:宿主是 Node 不限制分析能力;某语言要深度分析时,它是引擎背后一个子进程/服务,不是重写(扩展只在边界)。
- **多分辨率**:本体抓多个分辨率层级(系统/模块/文件/符号),每层有自己的派生规则。**这套 schema 是整个工具的地基**——粒度定不好,后面全虚。

---

## 4. 本体即 lockfile(linchpin)

派生出的本体写成**一个文件(JSON / 由 DuckDB/SQLite 索引),提交进仓库,当 lockfile 用**。一招串起多根支柱:

- **时间轴(支柱二)**:git 历史 = 本体的 4D 演化,白送。
- **设计态 vs 实际态可 diff**:设计 = 这个文件的"提案版本",diff = 语义 diff。
- **零漂移闸**:CI 里重新派生 → 跟提交的文件比对,不一致就挂——跟 `package-lock` 校验一模一样。
- **可评审**:本体变更在 PR 里以可读 diff 出现。

### 存储与查询

- **存储**:文件即真源(派生产物,非系统记录)。
- **查询**:嵌入式 **DuckDB 或 SQLite**,递归 CTE 做图遍历。规模仅 10³–10⁵ 节点,内存遍历微秒级。
- **不上图数据库**:Neo4j 这类**要求用户起服务**,直接干掉"装上即用",且本规模根本用不上。仅作为**可选后端**留给将来组织级大装机。

---

## 5. 镜头系统(支柱三)

一个本体,按 **(高度 × 关注面 × 时间 × 焦点对象)** 渲染出不同镜头。web 只是**模型渲染器 + 设计台前端**,**读同一份本体产物,绝不建并行后端**。

- 静态层(设计态/代码态):直接读提交的本体文件,**纯静态站点甚至单 HTML 可行,不用服务器**。
- 运行态:需要一条 websocket/SSE 连到运行时上报。
- 原则:**静态优先,实时可选,优雅降级**——没嵌 SDK 也能看设计+代码两态。

> web 形态参考 superpowers 的 brainstorm server:**单文件、零依赖、localhost**(它把 express/ws/chokidar + 714 个 node_modules 砍到 0 依赖,只用 Node 内置 `http/crypto/fs/path` 手写 RFC6455)。

---

## 6. 跨工具适配(可移植性)

目标:插入任意 AI 编程工具直接用。机制三件套:

1. **AGENTS.md 为基座** —— 2025 年底已成跨工具开放标准(Linux Foundation / Agentic AI Foundation;Codex/Cursor/Copilot/Gemini/Windsurf/Zed/Aider 全线支持)。先写 AGENTS.md。
2. **各 harness 薄清单** —— 进阶:为拿到"会话启动自动注入",按需补 `.claude-plugin/` / `.codex-plugin/` / `.cursor-plugin/` / `gemini-extension.json` 等(参考 superpowers 三种集成 shape:shell-hook / in-process plugin / instructions-file)。
3. **会话启动自动注入(非协商)** —— 每次开会话,把"你有 OntoSoma 方法论 + 当前本体状态/怎么查"塞进模型上下文,无需人工每次开启。这是整套集成的核心机制。

**分发**:走各 harness 自己的安装机制(marketplace / git URL / npm 包字段),**绝不编辑用户的全局配置**。

---

## 7. monorepo 布局(规划,KISS,先别过度拆)

```
ontosoma/
├─ AGENTS.md                  # 注入入口(阶段 3 接入)
├─ skills/                    # 方法论内容层(Markdown)
├─ packages/
│  ├─ engine/                 # 派生器 + 闸 + 本体存储 (TS)
│  ├─ web/                    # 可观测 web (TS,读同一本体产物)
│  └─ reporters/              # 运行态薄 SDK(按语言子目录)
├─ docs/                      # vision / architecture / decisions
└─ .ontosoma/                 # 派生出的本体产物(lockfile,提交)
```

---

## 8. 构建顺序(对应路线阶段 1→2)

1. 派生器(tree-sitter)能把一个目标库吐成本体产物(JSON lockfile)。
2. 本体产物可提交、可语义 diff。
3. 规则闸:重新派生 vs 已提交产物,不一致即 fail(像 lockfile 校验)。
4. 跑通后**立即吃狗粮**:OntoSoma 派生 OntoSoma 自己 + 对准 A-CDM。
5. 再补 web 观测、运行态 reporter、session 注入、各 harness 薄清单(阶段 3 通用分发)。
