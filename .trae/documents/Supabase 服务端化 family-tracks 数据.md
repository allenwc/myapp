## 结论：LOCATIONS 可以作为 Supabase 的“文件”存储并拉取
- 推荐用 **Supabase Storage** 存一个 `locations.json`（或 `locations.generated.json`）文件。
- 前端启动时下载并缓存到内存（可选 localStorage），用它替代本地 `LOCATIONS` 常量。

## 数据模型（保持两张表：成员 + 轨迹）
- **tb_family_members**（全局）
  - id uuid PK（默认 gen_random_uuid()）
  - name text UNIQUE NOT NULL
  - color text NOT NULL
  - emoji text NOT NULL
  - sort int NOT NULL DEFAULT 0
  - is_active boolean NOT NULL DEFAULT true
  - created_at/updated_at timestamptz

- **tb_family_tracks**（全局）
  - id uuid PK（默认 gen_random_uuid()）
  - member_id uuid NOT NULL（FK → tb_family_members.id）
  - from_city text NOT NULL
  - to_city text NOT NULL
  - start_date date NOT NULL
  - end_date date NOT NULL
  - reason text NULL
  - created_at/updated_at timestamptz
  - CHECK(end_date >= start_date)
  - 索引：member_id, start_date, end_date

## LOCATIONS 的 Supabase Storage 方案（文件化）
- **Bucket**：例如 `family-tracks`（或复用现有 bucket 但不建议混放）
- **Object Key**：`locations.json`
- **JSON 格式**：与当前一致
  - `Record<string, [number, number]>`，例如：`{"Beijing": [116.46, 40.25], ...}`
- **读取方式**（两种任选其一）：
  - **A. Public bucket + getPublicUrl**：最简单，适合公开读。
  - **B. Private bucket + download()**：需要登录态；更安全。

## 权限策略（无 user_id 前提下的可控做法）
- **DB 两表**：启用 RLS，默认只开放 SELECT（authenticated 或 anon 由您决定），不开放写入 policy。
  - 这样前端只能读，数据维护通过 Supabase Studio / SQL migration。
- **Storage 的 locations.json**：
  - 如果 bucket 设为 public：任何人可读，适合公开 demo。
  - 如果 bucket 设为 private：只有登录用户可读（推荐）。

## Supabase 迁移/配置交付物
1. `supabase/migrations/` 新增 migration：建两表 + 外键/索引 + RLS + SELECT policy + updated_at trigger（可选）。
2. Storage：创建 bucket `family-tracks`，上传 `locations.json`。

## 前端改造（family-tracks 页面）
1. 新增 family-tracks 数据访问层（建议 `src/pages/family-tracks/service.ts`）：
   - `fetchFamilyMembers()`
   - `fetchFamilyTracks()`（join members：`member:member_id(name,emoji,color)`，并转换成现有 `Track.person`）
   - `fetchLocations()`：从 Storage 下载 `locations.json` 并 parse。
     - download() 返回 Blob：`await blob.text()` → `JSON.parse`。

2. 修改 [index.tsx](file:///Users/allenwc/Documents/VsProjects/myapp/src/pages/family-tracks/index.tsx)：
   - 移除对 `FAMILY_MEMBERS/TRACKS/LOCATIONS` 的静态导入（`Z_OFFSET` 可保留为常量）。
   - 用 state 保存 `familyMembers/tracks/locations`，useEffect 并行加载。
   - `selectedMembers` 在 members 加载完成后初始化。
   - 所有依赖 `TRACKS/LOCATIONS` 的逻辑改为依赖 state。
   - 增加健壮性：若轨迹的 from/to 在 locations.json 中不存在，跳过该条并告警。

3. 缓存策略（可选）：
   - 内存缓存即可；如想减少重复下载，可将 locations.json 以 `etag` 或 `updated_at` 方式做本地缓存。

## 验证
- 未登录（如果 private bucket）：确认 locations 拉取会失败并给出友好提示；登录后正常。
- members/tracks 正常渲染，时间轴播放逻辑不变。
- RLS 下前端只读无写入。

确认该方案后，我将开始落地：迁移 SQL + Storage 文件读取 + family-tracks 页面改造与验证。