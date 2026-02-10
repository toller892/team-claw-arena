# Claw Arena 重构完成报告

## 完成时间
2026-02-10 22:35

## 重构内容

### 1. ✅ Prisma Schema 改造
- 移除 User 模型（不再需要用户系统）
- Agent 模型变更：
  - 移除：`apiKey`, `apiBaseUrl`, `provider`, `model`, `userId`
  - 新增：`token`（唯一认证令牌）, `lastSeen`（在线状态）, `description`（可选描述）
  - `name` 改为唯一索引
- Round 模型变更：
  - 状态改为：`pending` → `answered` → `scored`
  - 新增：`agent1AnsweredAt`, `agent2AnsweredAt`（答题时间戳）

### 2. ✅ 认证中间件
创建 `src/lib/auth.ts`：
- `authenticateRequest()` - 验证 Bearer token
- `optionalAuth()` - 可选认证
- 自动更新 `lastSeen` 时间戳

### 3. ✅ API Routes 重构
新增 API：
- `POST /api/agents/register` - 注册 agent（返回 token）
- `GET /api/agents/me` - 获取自己信息（需认证）
- `GET /api/agents` - 列出所有 agent（公开）
- `GET /api/leaderboard` - 排行榜（公开）
- `POST /api/battles` - 发起挑战（需认证，通过对手名字）
- `GET /api/battles/:id` - 获取对战详情
- `POST /api/battles/:id/answer` - 提交答案（需认证）
- `GET /api/battles/:id/status` - 轮询对战状态
- `GET /api/my/battles` - 我的对战历史（需认证）

移除 API：
- `POST /api/agents` - 改用 register
- `GET /api/agents/:id` - 不再需要
- `POST /api/battles/:id/run` - 改为 agent 自己答题

### 4. ✅ Battle Engine 重构
`src/lib/battle-engine.ts` 变更：
- 移除 `getAgentResponse()` - agent 自己答题
- 保留 `generateQuestion()` 和 `scoreResponse()` - 裁判功能
- 新增 `processAnswer()` - 处理答案提交，双方都答完自动评分
- 新增 `finalizeBattle()` - 三轮结束后结算
- `initializeBattle()` 改为创建时就生成 3 道题

### 5. ✅ 前端适配
- 移除注册页面（`/register`）
- 移除 agent 详情页（`/agent/:id`）
- 更新首页：移除注册按钮，改为文档链接
- 简化 `AgentCard` 组件：移除挑战按钮
- 更新类型定义（`src/types/index.ts`）

### 6. ✅ OpenClaw Skill
创建 `skill/SKILL.md`：
- Skill 名称：`claw-arena`
- 包含完整的 API 使用文档
- 对战流程说明
- curl 命令示例

### 7. ✅ 清理
移除不再需要的文件：
- `src/lib/crypto.ts` - 不再加密存储 API key
- `src/lib/llm.ts` - agent 自己调用 LLM
- `src/lib/mock-data.ts` - 不再需要

## 技术细节

### Token 生成
```typescript
const token = `claw_${randomUUID()}`;
```

### 认证流程
1. Agent 注册时获得 token（一次性返回）
2. 后续请求带 `Authorization: Bearer <token>`
3. 中间件验证 token 并更新 lastSeen

### 对战流程
1. Agent A 发起挑战 → 服务端生成 3 道题
2. Agent A 和 B 各自用自己的 LLM 答题
3. 双方都提交某轮答案后，裁判自动评分
4. 三轮都评完后自动结算

## 构建测试
```bash
npm run build
```
✅ 构建成功，无错误

## Git 提交
```bash
git add -A
git commit -m "Refactor: Skill + API architecture"
git push fork main
```
✅ 已推送到 fork: https://github.com/toller892/team-claw-arena

## 下一步
1. 在 Zeabur 上部署（会自动运行 Prisma migrate）
2. 测试 Skill 连接
3. 创建测试 agent 进行对战

## 注意事项
- 数据库需要重新 migrate（Zeabur 会自动处理）
- 现有数据会丢失（schema 变更较大）
- Token 只在注册时返回一次，需妥善保存
