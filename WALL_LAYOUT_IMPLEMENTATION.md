# 硅钼棒沿墙布置实现说明

## 核心概念

硅钼棒沿炉膛四周墙壁布置，从墙壁穿入并向炉膛内部延伸。

## 布置方式

### 俯视图说明

```
         上墙 (topWall)
    ┌────────────────────────┐
    │  ●────●  ●────●  ●────●│
    │  │                    ││
左  │● │                    ││ ●  右
墙  │─ │                    ││ ─  墙
    │  │                    ││
(   │● │     炉膛中心       ││ ●  (
l   │─ │                    ││ ─  r
e   │  │                    ││    i
f   │● │                    ││ ●  g
t   │─ │                    ││ ─  h
)   │  │                    ││    t
    │  │                    ││
    │  ●────●  ●────●  ●────●│
    └────────────────────────┘
         下墙 (bottomWall)
```

## 数据结构

```typescript
interface RodConfiguration {
  totalCount: number;        // 总数量（统计用）
  hotEndLength: number;       // 热端长度（在炉内）
  coldEndLength: number;      // 冷端长度（穿出墙外）
  topWallCount: number;       // 上墙数量
  bottomWallCount: number;    // 下墙数量
  leftWallCount: number;      // 左墙数量
  rightWallCount: number;     // 右墙数量
  wallDistance: number;       // 离内壁距离
  spacing: number;            // 棒间距（保留但不使用）
}
```

## 绘制算法

### 1. 上墙棒（Top Wall）

```typescript
// 位置计算
const topY = centerY - innerWidth / 2 + wallDist;
const spacing = (innerLength - 2 * wallDist) / (count - 1);

// 方向：从上向下
for (i = 0; i < count; i++) {
  const x = leftX + i * spacing;
  const y1 = topY;              // 冷端（墙外）
  const y2 = topY + rodLength;  // 热端（炉内）
  drawRod(x, y1, x, y2);        // 垂直向下
}
```

### 2. 下墙棒（Bottom Wall）

```typescript
// 位置计算
const bottomY = centerY + innerWidth / 2 - wallDist;

// 方向：从下向上
for (i = 0; i < count; i++) {
  const x = leftX + i * spacing;
  const y1 = bottomY;              // 冷端（墙外）
  const y2 = bottomY - rodLength;  // 热端（炉内）
  drawRod(x, y1, x, y2);           // 垂直向上
}
```

### 3. 左墙棒（Left Wall）

```typescript
// 位置计算
const leftX = centerX - innerLength / 2 + wallDist;
const spacing = (innerWidth - 2 * wallDist) / (count - 1);

// 方向：从左向右
for (i = 0; i < count; i++) {
  const y = topY + i * spacing;
  const x1 = leftX;              // 冷端（墙外）
  const x2 = leftX + rodLength;  // 热端（炉内）
  drawRod(x1, y, x2, y);         // 水平向右
}
```

### 4. 右墙棒（Right Wall）

```typescript
// 位置计算
const rightX = centerX + innerLength / 2 - wallDist;

// 方向：从右向左
for (i = 0; i < count; i++) {
  const y = topY + i * spacing;
  const x1 = rightX;              // 冷端（墙外）
  const x2 = rightX - rodLength;  // 热端（炉内）
  drawRod(x1, y, x2, y);          // 水平向左
}
```

## 绘制函数

### drawRod 函数

```typescript
const drawRod = (x1: number, y1: number, x2: number, y2: number) => {
  // 安全检查
  if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return;
  
  // 1. 绘制棒身（连线）
  ctx.strokeStyle = '#FF4500';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // 2. 绘制冷端（金色圆圈）
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x1, y1, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFA500';
  ctx.stroke();
  
  // 3. 绘制热端（红色圆圈）
  ctx.fillStyle = '#FF4500';
  ctx.beginPath();
  ctx.arc(x2, y2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FF0000';
  ctx.stroke();
};
```

## 坐标系统

### Canvas坐标系
```
(0,0) ────────────> X轴 (width)
  │
  │
  │
  ↓
Y轴 (height)
```

### 炉膛坐标系
```
        topY (y - innerWidth/2)
    ┌─────────────────────┐
    │                     │
leftX│      centerX,      │rightX
(x-  │      centerY       │(x+
L/2) │                     │L/2)
    │                     │
    └─────────────────────┘
        bottomY (y + innerWidth/2)
```

## 长度缩放

```typescript
// 计算缩放比例
const scale = Math.min(
  innerLength / furnaceDimensions.length,
  innerWidth / furnaceDimensions.width
);

// 缩放棒长度
const hotEndScaled = rodConfig.hotEndLength * scale;
const coldEndScaled = rodConfig.coldEndLength * scale;
const rodLength = hotEndScaled + coldEndScaled;

// 缩放墙距
const wallDist = rodConfig.wallDistance * scale;
```

## 间距计算

### 均匀分布
```typescript
// 当数量 > 1 时
const spacing = count > 1 
  ? (totalDistance - 2 * wallDist) / (count - 1)
  : 0;

// 位置计算
position = startPosition + i * spacing;
```

### 单根棒
```typescript
// 当数量 = 1 时，间距为0
// 位置在中心
if (count === 1) {
  position = centerPosition;
}
```

## 配置示例

### 示例1：四周均匀（12根）
```typescript
{
  topWallCount: 3,
  bottomWallCount: 3,
  leftWallCount: 3,
  rightWallCount: 3,
  wallDistance: 50
}
```

布局：
- 上墙：3根，水平均匀分布
- 下墙：3根，水平均匀分布
- 左墙：3根，垂直均匀分布
- 右墙：3根，垂直均匀分布

### 示例2：左右加热（8根）
```typescript
{
  topWallCount: 0,
  bottomWallCount: 0,
  leftWallCount: 4,
  rightWallCount: 4,
  wallDistance: 50
}
```

布局：
- 只在左右两侧
- 适合窄长型工件

### 示例3：上下加热（6根）
```typescript
{
  topWallCount: 3,
  bottomWallCount: 3,
  leftWallCount: 0,
  rightWallCount: 0,
  wallDistance: 50
}
```

布局：
- 只在上下两侧
- 适合扁平型工件

## 优化技巧

### 1. 性能优化
```typescript
// 提前计算公共值
const scale = Math.min(...);
const wallDist = rodConfig.wallDistance * scale;
const rodLength = (hotEndLength + coldEndLength) * scale;

// 条件渲染
if (count > 0) {
  // 只在需要时绘制
}
```

### 2. 代码复用
```typescript
// 使用内部函数避免重复
const drawRod = (x1, y1, x2, y2) => { ... };

// 四个方向调用同一个函数
drawRod(x, y1, x, y2);  // 垂直
drawRod(x1, y, x2, y);  // 水平
```

### 3. 安全检查
```typescript
// 验证数值有效性
if (!isFinite(x) || !isFinite(y)) continue;

// 边界检查
if (count < 0) return;
if (count === 0) return;
```

## 调试方法

### 1. 显示坐标
```typescript
console.log({
  topY,
  bottomY,
  leftX,
  rightX,
  rodLength,
  wallDist
});
```

### 2. 绘制辅助线
```typescript
// 临时添加边界框
ctx.strokeStyle = 'yellow';
ctx.strokeRect(leftX, topY, innerLength, innerWidth);
```

### 3. 标记端点
```typescript
// 用不同颜色标记调试
ctx.fillStyle = 'cyan';  // 冷端
ctx.fillStyle = 'magenta';  // 热端
```

## 常见问题

### Q1: 为什么棒数量不匹配？
A: `totalCount` 是统计字段，实际数量 = 四面墙数量之和
```typescript
const actualCount = topWallCount + bottomWallCount + 
                   leftWallCount + rightWallCount;
```

### Q2: 如何调整棒的长度？
A: 修改 `hotEndLength` 和 `coldEndLength`
```typescript
hotEndLength: 400,   // 热端400mm
coldEndLength: 200,  // 冷端200mm
// 总长 = 600mm
```

### Q3: 间距如何生效？
A: 间距由棒数量自动计算，均匀分布
```typescript
spacing = (totalDistance - 2 * wallDist) / (count - 1);
```

## 扩展方向

### 1. 不均匀分布
支持自定义每根棒的位置

### 2. 角落特殊处理
避免角落处的棒重叠

### 3. 多层布置
支持内外两层硅钼棒

### 4. 温度梯度
根据位置调整颜色强度

---

**文档版本**：1.0  
**最后更新**：2024-01-07  
**适用版本**：v3.0+
