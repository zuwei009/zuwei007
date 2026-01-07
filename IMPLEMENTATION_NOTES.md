# 硅钼棒显示实现说明 / Rod Display Implementation Notes

## 核心实现逻辑

### 1. 数据结构
```typescript
interface RodConfiguration {
  orientation: 'parallel' | 'perpendicular';
  hotEndLength: number;    // 热端长度
  coldEndLength: number;   // 冷端长度
  lengthDirection: number; // 长度方向数量
  widthDirection: number;  // 宽度方向数量
  wallDistance: number;    // 离内壁距离
}
```

### 2. 绘制逻辑

#### 平行于炉壁模式 (`parallel`)
- **棒的方向**：水平方向（X轴）
- **分布位置**：沿炉膛宽度方向（Y轴）排列
- **数量控制**：
  - `lengthDirection`：沿长度方向的列数
  - `widthDirection`：沿宽度方向的行数

```
长度方向 →
┌─────────────────────┐
│  ●─────●  ●─────●   │ ↓ 宽度方向
│  ●─────●  ●─────●   │
└─────────────────────┘
```

#### 垂直于炉壁模式 (`perpendicular`)
- **棒的方向**：垂直方向（Y轴）
- **分布位置**：沿炉膛长度方向（X轴）排列
- **数量控制**：
  - `lengthDirection`：沿长度方向的列数
  - `widthDirection`：沿宽度方向的行数

```
长度方向 →
┌─────────────────────┐
│  │  │  │  │  │  │  │ ↓ 宽度方向
│  ●  ●  ●  ●  ●  ●  │
│  │  │  │  │  │  │  │
│  ●  ●  ●  ●  ●  ●  │
└─────────────────────┘
```

### 3. 颜色编码

| 元素 | 颜色 | 颜色代码 | 含义 |
|------|------|----------|------|
| 冷端 | 金色 | #FFD700 | 电气连接端 |
| 热端 | 红色 | #FF4500 | 加热工作端 |
| 棒身 | 橙红 | #FF4500 | 电流通道 |

### 4. 尺寸计算

```typescript
// 缩放比例
const scale = Math.min(
  innerLength / furnaceDimensions.length,
  innerWidth / furnaceDimensions.width
);

// 棒长度（缩放后）
const rodLength = (hotEndLength + coldEndLength) * scale;

// 间距计算
const spacing = count > 1 
  ? (totalDistance - 2 * wallDistance) / (count - 1)
  : 0;
```

### 5. 防护检查

代码中包含以下安全检查：
- ✅ 除零保护：`count > 1` 检查
- ✅ 有限性检查：`isFinite(x) && isFinite(y)`
- ✅ 边界验证：确保在炉膛范围内

### 6. 绘制顺序

对每根硅钼棒：
1. **绘制棒身**（连线）
2. **绘制冷端**（金色圆圈）
3. **绘制热端**（红色圆圈）

这样确保端点圆圈在连线上方，视觉效果更好。

## 使用场景

### 场景1：均匀加热
```typescript
{
  orientation: 'parallel',
  lengthDirection: 4,
  widthDirection: 3,
  wallDistance: 100
}
```
结果：12根棒均匀分布，横向排列

### 场景2：纵向加热
```typescript
{
  orientation: 'perpendicular',
  lengthDirection: 6,
  widthDirection: 2,
  wallDistance: 100
}
```
结果：12根棒纵向排列，适合长条形工件

## 性能优化

1. **useCallback 缓存**：避免不必要的重绘
2. **条件渲染**：跳过无效坐标
3. **批量绘制**：减少 Canvas API 调用

## 调试技巧

### 1. 检查棒数量
```typescript
console.log('Total rods:', lengthDirection * widthDirection);
```

### 2. 验证坐标
```typescript
console.log('Rod position:', { x, y, rodLength });
```

### 3. 测试边界
- 设置 `wallDistance: 0` 查看贴墙效果
- 设置 `count: 1` 测试单根棒
- 切换 `orientation` 验证两种模式

## 常见问题

### Q1: 为什么有两种方向？
A: 实际工程中根据工件形状和加热需求选择：
- **平行**：适合宽方向均匀加热
- **垂直**：适合长方向均匀加热

### Q2: 冷端和热端的区别？
A: 
- **热端**：在炉膛内，全部发热
- **冷端**：部分穿出炉壁，用于电气连接

### Q3: 如何调整棒的长度？
A: 通过 `hotEndLength` 和 `coldEndLength` 参数：
```typescript
hotEndLength: 400,   // 热端 400mm
coldEndLength: 200,  // 冷端 200mm
// 总长 = 600mm
```

## 扩展方向

### 功能扩展
- [ ] 添加温度梯度显示
- [ ] 显示功率分布
- [ ] 添加动画效果
- [ ] 支持不规则布局

### 视觉优化
- [ ] 添加发光效果
- [ ] 根据温度调整颜色
- [ ] 添加阴影和景深
- [ ] 3D 侧视图

---

**文档版本**：1.0  
**最后更新**：2024-01-07  
**作者**：AI Assistant
