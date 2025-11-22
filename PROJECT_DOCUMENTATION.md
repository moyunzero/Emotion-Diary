# 情绪日记项目详细文档
## 📋 项目概述

**情绪日记** 是一款基于 React Native 开发的移动应用，专注于帮助用户记录、管理和分析情绪事件，特别是情侣或人际关系中的情绪波动。应用采用本地存储策略，确保数据隐私和离线可用性。

### 🎯 核心价值
- **情绪记录**: 提供便捷的情绪事件记录功能
- **数据洞察**: 通过可视化图表分析情绪模式
- **关系维护**: 通过天气隐喻直观展示关系状态
- **情绪释放**: 提供气话焚烧等情绪释放功能

---

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: React Native 0.81.5
- **开发平台**: Expo ~54.0.25
- **路由系统**: Expo Router (文件系统路由)
- **状态管理**: React Context + Hooks
- **本地存储**: AsyncStorage
- **类型支持**: TypeScript
- **UI组件**: 自定义组件 + Lucide React Native
- **图表库**: React Native Chart Kit

### 项目结构
```
emotion-diary/
├── app/                     # 路由页面层
│   ├── _layout.tsx          # 根布局
│   └── (tabs)/              # 标签页路由组
│       ├── _layout.tsx        # 标签导航布局
│       ├── index.tsx          # 主页面 → Dashboard
│       ├── record.tsx         # 记录页面 → Record
│       └── insights.tsx       # 洞察页面 → Insights
├── components/              # 可复用UI组件
│   ├── Dashboard.tsx        # 主页面组件
│   ├── Record.tsx           # 记录页面组件
│   ├── Insights.tsx         # 洞察页面组件
│   ├── WeatherStation.tsx    # 情绪气象站组件
│   ├── EntryCard.tsx        # 情绪记录卡片
│   └── Fireplace.tsx       # 气话焚烧动画
├── context/                # 状态管理
│   └── AppContext.tsx      # 全局状态Context
├── types.ts               # TypeScript类型定义
├── constants.ts           # 应用常量配置
└── PROJECT_DOCUMENTATION.md # 项目文档
```

---

## 📱 页面详细说明

### 1. 情绪气象站 (Dashboard)

#### 🎨 页面布局
- **顶部头部**: 应用标题 + 当前日期 + 天气建议 + 用户头像
- **中部区域**: WeatherStation 组件 (情绪天气可视化)
- **下部区域**: 过滤器 + 情绪记录列表

#### 🔧 核心功能
1. **情绪天气展示**
   - 根据活跃情绪值计算关系天气
   - 4级天气状态：晴朗→多云→有雨→暴风雨
   - 动态背景色和图标

2. **记录过滤系统**
   - 支持三种过滤状态：未处理/已和解/全部记录
   - 下拉式过滤器，带动画效果
   - 实时显示记录数量统计

3. **记录列表管理**
   - 卡片式展示，支持展开/收起
   - 显示情绪级别、涉事人员、触发因素
   - 提供和解打卡、气话焚烧、删除功能

#### 🎯 交互逻辑
```typescript
// 过滤逻辑
const filteredEntries = entries.filter(e => {
  if (filter === 'active') return e.status === Status.ACTIVE;
  if (filter === 'resolved') return e.status === Status.RESOLVED;
  return true;
});

// 气话焚烧触发
const handleBurn = (text: string) => {
  setBurnText(text);
  setShowFireplace(true);
};
```

### 2. 记录情绪 (Record)

#### 🎨 页面布局
- **顶部头部**: 返回按钮 + 页面标题
- **滚动内容**: 垂直表单布局，支持键盘避让
- **底部操作**: 固定提交按钮

#### 🔧 核心功能
1. **5级情绪选择器**
   - 视觉化情绪级别：😒(有点烦) → 💥(爆炸了)
   - 选中状态动画和缩放效果
   - 每个级别对应不同颜色主题

2. **内容输入区域**
   - 多行文本输入框
   - 占位符提示："尽情吐槽吧，这里很安全..."
   - 实时字符验证

3. **期限管理系统**
   - 预设期限选项：今天谈/本周内/本月内/以后说/自己消化
   - 支持自定义期限输入
   - 颜色编码表示紧急程度

4. **标签系统**
   - **人员标签**: 预设9种常见关系 + 自定义添加
   - **触发因素**: 12种常见触发事件 + 自定义添加
   - 支持多选，自定义标签本地持久化

#### 🎯 关键逻辑
```typescript
// 自定义标签管理
const handleAddCustomTag = async (type: 'people' | 'trigger', value: string) => {
  if (type === 'people') {
    const newOpts = [...customPeopleOptions, value];
    setCustomPeopleOptions(newOpts);
    await AsyncStorage.setItem('custom_people', JSON.stringify(newOpts));
  }
};

// 记录提交
const handleSubmit = async () => {
  const finalDeadline = isCustomDeadline ? customDeadlineText.trim() : deadline;
  addEntry({
    moodLevel,
    content,
    deadline: finalDeadline,
    people: selectedPeople.length ? selectedPeople : ['其他'],
    triggers: selectedTriggers,
  });
};
```

### 3. 数据洞察 (Insights)

#### 🎨 页面布局
- **顶部标题**: "数据洞察"
- **图表区域**: 两个主要图表卡片
- **总结区域**: 月度统计报告

#### 🔧 核心功能
1. **情绪分布柱状图**
   - X轴：1-5级情绪级别
   - Y轴：对应的记录数量
   - 粉红色主题配色
   - 显示具体数值标签

2. **惹我生气排行榜饼图**
   - 展示前5名"惹事人员"统计
   - 彩色扇区图示
   - 自定义图例说明

3. **月度总结报告**
   - 统计本月情绪波动次数
   - 对比上个月处理速度
   - 鼓励性文字反馈

#### 🎯 数据处理逻辑
```typescript
// 情绪分布统计
const moodData = useMemo(() => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach(e => counts[e.moodLevel]++);
  return {
    labels: ['1级', '2级', '3级', '4级', '5级'],
    datasets: [{ data: Object.values(counts) }]
  };
}, [entries]);

// 人员排行榜统计
const offenderData = useMemo(() => {
  const counts: Record<string, number> = {};
  entries.forEach(e => {
    e.people.forEach(p => {
      counts[p] = (counts[p] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}, [entries]);
```

---

## 🎨 UI设计系统

### 色彩主题
- **主色调**: 粉红色系 (#EF4444, #FEF2F2, #FFF5F5)
- **背景色**: 温暖粉色背景 (#FFF5F5)
- **卡片背景**: 纯白色 (#FFFFFF)
- **文字颜色**: 深灰色 (#1F2937, #4B5563, #6B7280)

### 设计语言
1. **圆角设计**: 统一使用16-24px圆角
2. **阴影效果**: 轻微阴影增强层次感
3. **间距系统**: 8px基础间距倍数系统
4. **字体层次**: 24px标题 → 18px副标题 → 14px正文 → 12px辅助

### 交互规范
- **触摸反馈**: 透明度变化 (activeOpacity: 0.7)
- **加载状态**: ActivityIndicator + 提示文字
- **空状态**: 友好的emoji + 文字提示
- **错误处理**: Alert弹窗提示

---

## 🔄 状态管理架构

### 全局状态 (AppContext)
```typescript
interface AppContextType {
  entries: MoodEntry[];        // 所有情绪记录
  addEntry: (entry) => void;   // 添加记录
  resolveEntry: (id) => void;  // 标记和解
  deleteEntry: (id) => void;   // 删除记录
  weather: WeatherState;         // 当前情绪天气
}
```

### 数据流模式
1. **用户操作** → 触发Context Action
2. **状态更新** → 触发useEffect副作用
3. **自动保存** → AsyncStorage持久化
4. **UI重渲染** → React自动响应

### 情绪天气算法
```typescript
const calculateWeather = () => {
  const activeEntries = entries.filter(e => e.status === Status.ACTIVE);
  const score = activeEntries.reduce((acc, curr) => acc + curr.moodLevel * 2, 0);
  
  let condition: WeatherState['condition'] = 'sunny';
  let description = '相处不错哦~';

  if (score > 30) {
    condition = 'stormy';
    description = '预警！关系需要紧急维护！';
  } else if (score > 20) {
    condition = 'rainy';
    description = '建议安排一次深度沟通';
  } else if (score > 10) {
    condition = 'cloudy';
    description = '该聊聊了，小摩擦有点多';
  }

  setWeather({ score, condition, description });
};
```

---

## 🧩 核心组件详解

### WeatherStation 组件
**功能**: 情绪天气可视化展示

**特性**:
- 动态天气图标 (Sun, Cloud, CloudRain, CloudSnow)
- 响应式背景色变化
- 情绪指数显示
- 天气描述文字

**渲染逻辑**:
```typescript
const getWeatherIcon = () => {
  switch (weather.condition) {
    case 'sunny': return <Sun size={48} color="#F59E0B" />;
    case 'cloudy': return <Cloud size={48} color="#6B7280" />;
    case 'rainy': return <CloudRain size={48} color="#3B82F6" />;
    case 'stormy': return <CloudSnow size={48} color="#EF4444" />;
  }
};
```

### EntryCard 组件
**功能**: 情绪记录卡片展示

**特性**:
- 情绪表情徽章
- 展开/收起动画
- 批量操作按钮
- 状态视觉区分

**状态管理**:
```typescript
const [isExpanded, setIsExpanded] = useState(false);
const isResolved = entry.status === Status.RESOLVED;
```

### Fireplace 组件
**功能**: 气话焚烧动画效果

**特性**:
- 全屏模态展示
- 渐入渐出动画
- 文字消失效果
- 自动关闭机制

**动画实现**:
```typescript
useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, { toValue: 1, duration: 500 }),
    Animated.timing(scaleAnim, { toValue: 1, duration: 500 })
  ]).start();

  setTimeout(() => {
    Animated.timing(textAnim, { toValue: 0, duration: 2000 })
      .start(() => setTimeout(onClose, 500));
  }, 1000);
}, []);
```

---

## 📊 数据模型设计

### MoodEntry 接口
```typescript
interface MoodEntry {
  id: string;                    // 唯一标识符
  timestamp: number;             // 创建时间戳
  moodLevel: MoodLevel;          // 情绪级别 (1-5)
  content: string;               // 情绪描述内容
  deadline: string;              // 处理期限 (支持自定义)
  people: string[];              // 涉事人员标签
  triggers: string[];            // 触发因素标签
  status: Status;               // 记录状态
  resolvedAt?: number;           // 和解时间戳
}
```

### 枚举类型定义
```typescript
enum MoodLevel {
  ANNOYED = 1,      // 有点烦 😒
  UPSET = 2,        // 不开心 😔  
  ANGRY = 3,        // 生气了 😠
  FURIOUS = 4,      // 很生气 🤬
  EXPLOSIVE = 5     // 爆炸了 💥
}

enum Deadline {
  TODAY = 'today',         // 今天谈
  THIS_WEEK = 'week',      // 本周内
  THIS_MONTH = 'month',     // 本月内
  LATER = 'later',         // 以后说
  SELF_DIGEST = 'self'     // 自己消化
}

enum Status {
  ACTIVE = 'active',        // 未处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved'     // 已和解
}
```

---

## 🔧 关键技术实现

### 1. 路由系统 (Expo Router)
```typescript
// 标签页布局配置
<Tabs screenOptions={{
  headerShown: false,
  tabBarStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: 80,
  },
  tabBarActiveTintColor: '#EF4444',
  tabBarInactiveTintColor: '#D1D5DB',
}}>
  <Tabs.Screen name="index" options={{ title: '气象站' }} />
  <Tabs.Screen name="record" options={{ title: '记一笔' }} />
  <Tabs.Screen name="insights" options={{ title: '洞察' }} />
</Tabs>
```

### 2. 数据持久化 (AsyncStorage)
```typescript
// 保存记录
const saveEntries = async () => {
  try {
    await AsyncStorage.setItem('mood_entries', JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving entries:', error);
  }
};

// 加载记录
const loadEntries = async () => {
  try {
    const saved = await AsyncStorage.getItem('mood_entries');
    if (saved) {
      setEntries(JSON.parse(saved));
    } else {
      setEntries(MOCK_ENTRIES); // 首次使用加载示例数据
    }
  } catch (error) {
    setEntries(MOCK_ENTRIES);
  }
};
```

### 3. 自定义标签持久化
```typescript
// 加载自定义标签
const loadCustomOptions = async () => {
  try {
    const people = await AsyncStorage.getItem('custom_people');
    const triggers = await AsyncStorage.getItem('custom_triggers');
    if (people) setCustomPeopleOptions(JSON.parse(people));
    if (triggers) setCustomTriggerOptions(JSON.parse(triggers));
  } catch (error) {
    console.error('Error loading custom options:', error);
  }
};

// 保存自定义标签
await AsyncStorage.setItem('custom_people', JSON.stringify(newOpts));
```

---

## 🎯 用户体验设计

### 微交互设计
1. **页面切换**: 底部标签栏滑动切换
2. **卡片展开**: 点击展开操作区域，带平滑动画
3. **情绪选择**: 选中时缩放和透明度变化
4. **标签选择**: 选中状态背景色变化
5. **加载状态**: 骨架屏或加载指示器

### 错误处理策略
- **网络错误**: 本地存储兜底
- **数据异常**: 使用默认示例数据
- **用户输入**: 实时验证和友好提示
- **权限问题**: 引导用户授权

### 无障碍支持
- **语义化标签**: 使用accessibilityLabel
- **触摸区域**: 最小44px触摸区域
- **颜色对比**: 符合WCAG标准
- **屏幕阅读器**: 支持VoiceOver等

---

## 📈 性能优化策略

### 1. 渲染优化
- **React.memo**: 防止不必要的重渲染
- **useMemo**: 缓存计算结果
- **useCallback**: 缓存函数引用
- **FlatList**: 长列表虚拟化 (可扩展)

### 2. 内存管理
- **图片缓存**: 使用expo-image缓存
- **动画优化**: 使用useNativeDriver
- **定时器清理**: useEffect清理副作用

### 3. 存储优化
- **数据压缩**: JSON序列化优化
- **增量更新**: 只保存变更数据
- **缓存策略**: 内存+磁盘双重缓存

---

## 🔒 数据安全与隐私

### 本地存储安全
- **数据加密**: 可扩展使用加密库
- **访问控制**: 应用沙盒隔离
- **备份策略**: 导出功能 (可扩展)

### 用户隐私保护
- **离线优先**: 数据不上传云端
- **本地删除**: 支持完全删除
- **透明度**: 开源代码审计

---

## 🚀 扩展性设计

### 功能扩展点
1. **数据导出**: CSV/JSON格式导出
2. **主题系统**: 深色模式支持
3. **通知系统**: 情绪提醒功能
4. **统计功能**: 更丰富的数据分析

### 技术扩展
1. **云端同步**: Firebase/Supabase集成
2. **AI功能**: 情绪分析建议
3. **社交功能**: 匿名分享社区
4. **多语言**: 国际化支持

---

## 📝 开发与部署

### 开发环境
```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn start

# 运行设备
yarn ios     # iOS模拟器/真机
yarn android # Android模拟器/真机  
yarn web     # Web版本
```

### 构建发布
```bash
# 构建Android
expo build:android

# 构建iOS  
expo build:ios

# 构建Web
expo build:web
```

---

## 🎉 总结

情绪日记项目是一个设计精良、功能完整的React Native应用，具有以下特点：

### ✅ 优势
- **完整功能**: 记录、展示、分析、释放全流程
- **优秀设计**: 统一的UI设计和交互体验
- **技术先进**: 现代化技术栈和最佳实践
- **隐私友好**: 完全本地存储，保护用户隐私
- **高可维护性**: 清晰的代码结构和文档

### 🔮 愿景
项目为情绪管理和关系维护提供了有价值的工具，通过技术创新帮助用户更好地理解和处理情绪，促进更健康的人际关系。未来可通过AI集成、云端同步等功能进一步提升用户体验。

---

*文档版本: 1.0*  
*最后更新: 2025年11月22日*
