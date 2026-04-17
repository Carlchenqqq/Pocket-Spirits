# 精灵纪元 (Pocket Spirits) - 完整游戏策划文档

> 版本：V1.0 | 日期：2026-04-15 | 状态：已确认
> 风格定位：东方幻想风（山海经+宝可梦玩法）| 平台：移动端小游戏（抖音/微信）
> 落地策略：最小可玩闭环优先，迭代扩充

---

# 第一部分：游戏总览

## 1.1 游戏基本信息

| 项目 | 内容 |
|------|------|
| **中文名** | 精灵纪元 |
| **英文名** | Pocket Spirits |
| **类型** | 东方幻想 RPG / 精灵收集对战 |
| **平台** | Web → 移动端小游戏（抖音/微信） |
| **视角** | 俯视角像素 RPG |
| **核心循环** | 探索地图 → 遇野怪/训练师 → 战斗捕捉/升级 → 挑战道馆 → 解锁新区域 |

## 1.2 核心体验关键词

- **收集**：发现并收服来自东方传说的灵兽
- **成长**：培养精灵队伍，进化、学技能、配招
- **探索**：穿越九州大地，解开灵脉之谜
- **对战**：属性克制策略深度 + 即时战斗操作

## 1.3 分期开发计划

### V1 - 最小可玩闭环（快速落地目标）

```
可游玩时长：5-8小时
精灵数量：25种（含3阶进化链）
地图数量：~10张（3城镇 + 6野外 + 1特殊）
道馆数量：3个（木→火→水）
NPC数量：20+
技能数量：40个
物品数量：25种

通关条件：集齐3枚徽章，击败反派干部，解锁第4章区域入口
```

### V2 - 内容扩充版

```
可游玩时长：20-30小时
精灵数量：50种
地图数量：~20张
道馆数量：6个（完整上半部）
新增系统：精灵进化、天气系统、 breeding预研
剧情：完成第4-6章
```

### V3 - 完整版

```
可游玩时长：100-200小时
精灵数量：80-100种
地图数量：35张+
道馆数量：8个 + 联盟四天王 + 冠军
新增系统：二周目、神兽捕捉、PVP、全图鉴挑战、支线任务体系
剧情：完整8章 + 二周目内容
```

---

# 第二部分：世界观架构

## 2.1 世界名称：九州灵域 (Nine Provinces Spirit Realm)

### 核心设定

远古时期，天柱折、地维绝，九州大地灵气溃散。上古神兽为保万物生灵，将自身灵力化作**灵脉**埋藏于地底，并以**灵晶**之形封印各地。

千年之后，灵晶孕育出无数**灵兽（精灵）**——它们是自然灵气的具现化，各有属性与性情。

人类中的**灵师**能与灵兽缔结契约，共同修行。但有一股名为**「浊流」**的暗势力试图吞噬所有灵脉，将灵兽变为战争兵器……

## 2.2 九州地理架构（整体蓝图）

九州由中央的中州向八方辐射，形成扇形推进的游戏地图结构：

```
                    【北境·玄冥洲】（终局区域）
                          │
           【东域·青丘洲】──【中州·神州】──【西域·大荒洲】
                          │
                    【南疆·炎洲】
                          │
    【出生地】青叶镇 → 碧波镇 → （逐步向外扩展...）
```

### 区域分期边界

| 章节 | 区域 | 对应开发阶段 | 核心内容 |
|------|------|-------------|---------|
| 第1章 | 中州南部（出生地周边） | **V1 必做** | 新手教学、第一只精灵、首个道馆 |
| 第2章 | 中州东部沿海 | **V1 必做** | 水系道馆、海上航线初探、反派初现 |
| 第3章 | 中州西部山地 | **V1 必做** | 火系道馆、浊流组织基地发现、关键剧情转折 |
| 第4章 | 中州北部平原 | V2 | 草系道馆、灵脉秘密揭开、精灵进化系统开启 |
| 第5章 | 青丘洲（东方狐族之地） | V2 | 妖系/幻系道馆、分支剧情、隐藏精灵 |
| 第6章 | 大荒洲（西方沙漠） | V2 | 地系/岩系道馆、古代遗迹、神兽线索 |
| 第7章 | 玄冥洲（北方冰原）+ 炎洲（南方火山） | V3 | 冰/龙系道馆、联盟之路、四天王 |
| 第8章 | 神州中心·灵源之巅 | V3 | 决战浊流首领、终极神兽、真结局 |

## 2.3 势力阵营

### 主角方

| 势力 | 说明 |
|------|------|
| **灵师公会** | 正规灵师组织，管理道馆联盟、发布任务 |
| **各城镇** | 提供休息、商店、信息的据点 |

### 反派势力：「浊流」(Turbulence)

- **本质**：试图控制所有灵脉的暗势力组织
- **结构**：首领 → 四大干部（对应四大元素）→ 一般成员
- **理念**：认为灵兽应被统治而非伙伴，追求灵力统一
- **命名风格**：代号制，如「焱」「霜」「岩」「雾」

### 中立势力

| 势势 | 说明 |
|------|------|
| **山野散修** | 不属于公会的自由灵师，有些友善有些敌对 |
| **灵兽守护者** | 古老组织中保护野生灵兽的人，对主角态度复杂 |

---

# 第三部分：属性系统设计

## 3.1 属性列表（12种）

参考东方五行 + 自然元素设计：

| 属性ID | 中文名 | 代表色 | 设计灵感 | 克制(2x) | 被(x0.5) | 无效(0x) |
|--------|--------|--------|---------|----------|----------|---------|
| FIRE | 火 | #E73228 红 | 南方朱雀 | 草,冰 | 水,土,岩 | - |
| WATER | 水 | #2996CE 蓝 | 北方玄武 | 火,土,岩 | 草,电 | - |
| GRASS | 草/木 | #3DAE2B 绿 | 东方青龙 | 水,土,岩 | 火,电 | - |
| ELECTRIC | 电 | #F5C518 黄 | 雷电 | 水,飞 | 土,草,龙 | - |
| GROUND | 土/地 | #A06B30 棕 | 大地 | 火,电,毒,岩,冰 | 草,水 | 电 |
| ROCK | 岩 | #B0A48F 灰 | 山石矿物 | 火,冰,飞,虫 | 水,草 | - |
| ICE | 冰 | #7CCBE4 浅蓝 | 北方冰雪 | 草,地,龙,飞 | 火 | - |
| DRAGON | 龙 | #7B68EE 紫 | 中国龙神话 | 龙 | - | 妖(暂缺) |
| DARK | 暗/影 | #4A4063 黑 | 阴影幽冥 | 灵,幽灵 | 格斗 | - |
| PSYCHIC | 灵/超能 | #FF6B9D 粉 | 灵力精神 | 格斗,毒 | 暗,恶 | - |
| FIGHTING | 格斗 | #E07020 橙 | 武术体术 | 普,暗,岩,冰,钢 | 灵,幽灵,飞 | 幽灵 |
| NORMAL | 普通 | #A8A878 白 | 无特殊属性 | - | 格斗 | 幽灵 |

> 当前demo已有 Fire/Water/Grass/Electric/Rock/Dark/Dragon + Normal，需**新增 Ice/Psychic/Fighting**三种。

## 3.2 属性克制矩阵（AI直接可用）

```javascript
/**
 * 属性克制倍率表 - 直接用于 battle.js 伤害计算
 * 用法: const multiplier = TYPE_CHART[attackType][defendType] || 1.0;
 *
 * 值说明:
 *   2.0 = 效果绝佳 (Super Effective)
 *   0.5 = 效果不佳 (Not Very Effective)
 *   0.0 = 无效 (No Effect)
 *   1.0 = 正常效果 (未列出即为此值)
 */
const TYPE_CHART = {
  fire:     { water:0.5, grass:2.0, ground:0.5, rock:0.5, ice:2.0 },
  water:    { fire:2.0, grass:0.5, electric:0.5, rock:2.0, ground:2.0 },
  grass:    { fire:0.5, water:2.0, electric:0.5, ground:2.0, rock:2.0 },
  electric:{ water:2.0, grass:0.5, ground:0.0, flying:2.0 },
  ground:   { fire:2.0, electric:2.0, grass:0.5, rock:2.0, poison:2.0 },
  rock:     { fire:2.0, ice:2.0, flying:2.0, bug:2.0 },
  ice:      { fire:0.5, grass:2.0, ground:2.0, dragon:2.0, flying:2.0 },
  dragon:   { dragon:2.0 },
  dark:     { psychic:2.0, fighting:0.5, ghost:2.0 },
  psychic:  { fighting:2.0, dark:0.0, poison:2.0 },
  fighting: { normal:2.0, dark:2.0, rock:2.0, ice:2.0, steel:2.0, psychic:0.5, ghost:0.0 },
  normal:   { fighting:0.5, ghost:0.0 }
};
```

## 3.3 状态异常系统

| 状态 | statusID | 图标 | 持续 | 效果 | 触发 | 治愈 |
|------|----------|------|------|------|------|------|
| 中毒 | POISON | ☠️ | 直到切换/战斗结束 | 每回合损HP的1/8 | 毒技能 | 解毒药/换人 |
| 烧伤 | BURN | 🔥 | 直到切换/战斗结束 | 每回合损HP的1/16，物攻减半 | 火技能 | 治疗喷雾/换人 |
| 麻痹 | PARALYZE | ⚡ | 随机解除 | 25%概率无法行动 | 电技能 | 麻痹治愈药 |
| 冰冻 | FREEZE | ❄️ | 随机解除 | 无法行动 | 冰技能 | 受火攻/随机解冻 |
| 睡眠 | SLEEP | 😴 | 1-3回合 | 无法行动 | 睡眠技 | 受攻击/到期 |
| 束缚 | BIND | 🔗 | 2-4回合 | 每回合损HP的1/8，不可换人 | 束缚技 | 回合结束 |

> **V1优先级**: 先实现中毒/烧伤/麻痹/睡眠四种基础状态，冰冻和束缚留V2。

---

# 第四部分：主线剧情设计（8章完整蓝图）

## 4.1 剧情核心驱动力

```
主线驱动力：「灵脉共鸣」—— 主角拥有能感知灵脉的特殊体质
核心冲突：浊流组织试图控制灵脉 vs 主角保护灵兽自由
终极抉择：是否唤醒终极神兽·混沌（可能毁灭也可能拯救世界）
```

## 4.2 第八章节详细设计

### 第1章：灵师之路启程（V1 必做）

**区域**：青叶镇 → 青叶野外 → 碧波镇 → 碧波森林

**剧情梗概**：
- 主角年满16岁，前往灵师公会领取初始灵兽，**墨博士**（对应大木博士角色）引导选择三只御三家
- 获得初始精灵后，父亲给与**灵图仪**（图鉴设备）和**灵师手册**
- 墨博士委托主角帮他完成「中州南部灵脉调查」——实际是测试主角资质
- 前往碧波镇途中遇到**第一个浊流侦查员**（伪装成普通训练师），击败后发现可疑线索
- 到达碧波镇，得知**碧波道馆**馆主最近行为异常
- 进入道馆挑战，发现道馆已被浊流渗透！馆主被软禁，冒充者是一个浊流小头目
- 击败冒充者，救出真正馆主，获得**碧波徽章（水系）**
- 真正馆主透露：其他地区的道馆也收到了「合作邀请」，情况不妙
- **章末BOSS**：浊流小头目「浪」—— 水/暗属性混合训练师

**关键剧情节点**：
1. 选择御三家（草/火/土）
2. 第一次战斗教学战
3. 野生精灵首次捕捉教学
4. 浊流初现伏笔
5. 首个道馆战（伪馆主）
6. 真相揭露 + 章末BOSS战

**预计游玩时长**：1-2小时

**解锁内容**：
- 捕捉系统、商店系统、基础地图
- 3-5种新精灵可捕捉

---

### 第2章：海上的阴云（V1 必做）

**区域**：碧波港 → 海上航道 → 礁石群岛 → 云溪镇 → 迷雾沼泽

**剧情梗概**：
- 墨博士联系主角，让他去**云溪镇**找**灵渊长老**——唯一知道灵脉真相的人
- 前往港口需要经过海上航道，船夫说最近有**海怪出没**阻止通行
- 清除海上障碍（实际上是一只被浊流用装置激怒的野生灵兽），安抚后它加入图鉴
- 到达云溪镇，发现灵渊长老的居所被封印，需要收集三块**灵晶碎片**解封
- 碎片分布在：礁石群岛深处、迷雾沼泽中心、云溪镇地下水脉
- 探索过程中多次遭遇浊流成员竞争抢夺碎片
- 收集齐碎片后解封，见到灵渊长老
- 长老揭示：主角的**灵脉共鸣体质**是千年一遇，能够直接沟通灵兽内心
- 同时警告：浊流首领**「虚空」**也在寻找这种体质的人——为了某种古老仪式
- **章末BOSS**：浊流干部「霜」—— 冰/灵属性精英训练师

**关键NPC登场**：
- **灵渊长者**：白发老者，前代最强灵师，知晓灵脉秘密
- **阿潮**： rival 角色，和主角同一天出发的新手灵师，性格高傲但正直

**预计游玩时长**：2-3小时

**解锁内容**：
- 冲浪/船只系统（简化版）、灵晶收集任务
- 8-10种新精灵（含水域专属）
- V1第二个道馆：云溪道馆（需在BOSS战之前挑战）

---

### 第3章：烈焰中的真相（V1 必做）

**区域**：赤岩古道 → 熔炉山谷 → 炎阳城 → 废弃矿坑

**剧情梗概**：
- 线索指向西部山区有**浊流的大型基地**
- 途中经过**炎阳城**，挑战火系道馆
- 道馆馆主**炎烈**是一位热血青年，战后主动提出帮助主角调查
- 在废弃矿坑深处发现**浊流研究所**——他们在做**灵兽强制进化实验**
- 目睹一只被实验折磨的灵兽，主角爆发灵脉共鸣之力安抚了它（关键剧情时刻）
- 研究所日志揭示：浊流在寻找**四象神器**——分别藏在四方位的神器，集齐可控制所有灵脉
- 研究所被主角引发混乱后自毁，但浊流干部**「焱」**逃脱并放话：「你只会让事情变得更糟」
- **章末BOSS**：浊流干部「焱」+ 实验体灵兽 —— 火/龙属性

**关键转折**：
- 主角第一次质疑自己：干涉真的对吗？灵兽应该被人管着吗？
- 炎烈成为固定队友角色（非同行战斗，但在多处提供支援）

**预计游玩时长**：2-3小时

**V1至此完结**：玩家已体验完整的「学习→探索→对抗」循环，共3枚徽章，约5-8小时内容。

---

### 第4章：北境之风（V2）

**区域**：清风原 → 古木森林 → 牧云城 → 灵泉秘境

**核心事件**：
- 北方平原传来灵脉异常的消息
- 发现**精灵自然进化**的现象（进化系统在此章正式引入）
- **牧云城草系道馆**挑战
- 遇到**灵兽守护者**组织，他们对人类持敌对态度
- 揭示主角父母当年的秘密——他们也是灵师，在某个事件中失踪了
- **章末BOSS**：守护者首领「苍松」（非反派，而是理念之战）

**新增系统**：精灵进化

---

### 第5章：青丘狐踪（V2）

**区域**：渡海东行 → 青丘洲沿岸 → 狐妖谷 → 幻梦林 → 月华宫

**核心事件**：
- 东方狐族之地，灵兽普遍具有**幻属性**
- **月华宫**的狐族公主被浊流绑架
- 揭示浊流「雾」干部就是狐族叛徒
- 支线：帮助狐族解决内乱，获得进入月华宫深处的权限
- 发现第二件**四象神器**：**朱雀之羽**
- **章末BOSS**：浊流干部「雾」—— 幻/暗属性

**新增系统**：昼夜循环影响某些精灵出现

---

### 第6章：荒漠遗迹（V2）

**区域**：西行沙漠 → 大荒洲绿洲 → 古代王陵 → 地底迷宫

**核心事件**：
- 西方沙漠下埋藏着**上古文明遗迹**
- 浊流已经在挖掘第三件神器
- 遗迹中有大量**岩/地/钢**属性强力野生精灵
- 解读古代壁画，了解千年前的「灵脉战争」全貌
- 第三件神器**玄武甲片**争夺战
- **章末BOSS**：浊流干部「岩」+ 古代守卫机械 —— 岩/钢属性

**新增系统**：秘传技能（劈岩石碎等野外障碍清除）

---

### 第7章：冰与火之歌（V3）

**区域**：北渡冰海 → 玄冥洲冰原 → 极光圣殿 | 南行火山 → 炎洲熔核 → 炎神殿

**核心事件**：
- 同时前往南北两极获取最后线索
- **玄冥洲**：冰系道馆 + 四天王之一的前身故事
- **炎洲**：龙系道馆 + 火山地底的龙巢
- 两地都指向同一个终点：神州中心的**灵源之巅**
- 第四件神器**白虎之牙**的位置揭晓
- 浊流首领「虚空」正式现身——他竟然是**灵渊长老的亲弟弟**，因理念分歧决裂
- **章末BOSS**：虚空亲卫队（连续三场战斗）

**新增系统**：神兽相关传说触发

---

### 第8章：灵源决战（V3终章）

**区域**：神州中心 → 灵源之巅（多层地下副本式地图）

**核心事件**：
- 集齐四象神器，开启灵源之巅入口
- 内部是**多层级挑战**：每层一个主题试炼（力量/智慧/勇气/心灵）
- 浊流已完成仪式准备，**混沌**（终极神兽）即将苏醒
- 关键抉择场景：主角可以用神器压制混沌或与混沌共鸣
- **两种结局路线**：
  - **光明结局**：与混沌建立羁绊，净化浊流的黑暗灵力，世界恢复平衡
  - **暗影结局**（需特定条件触发）：吸收混沌之力成为新的灵脉主宰（二周目开启）
- 通关后解锁**联盟挑战**：四天王 + 冠军（冠军是 Rival 阿潮）
- 二周目：更强训练师、稀有精灵出现、隐藏神兽捕捉、真结局补完

**最终BOSS序列**：
1. 浊流四干部连战（复活强化版）
2. 虚空（使用改造后的神兽级灵兽）
3. 混沌（可控/不可控取决于选择）
4. （二周目）冠军阿潮

---

# 第五部分：精灵库设计（54种完整数据）

> 以下精灵数据为**AI可直接解析的格式**，可用于生成 `creatures.json`。
> 命名规则：东方幻想风，参考山海经、民间传说、五行元素。
> 每个精灵包含：ID、名称、属性（支持双属性）、进化链、基础六维种族值、栖息地、设计描述。

## 5.1 数据结构说明

```javascript
// creatures.json 条目结构
{
  "id": 1,                    // 唯一编号
  "name": "灵狐",             // 名称
  "nameEn": "SpiritFox",      // 英文名（内部用）
  "types": ["grass"],         // 属性数组，单或双属性
  "evolution": null | {       // 进化信息
    "evolvesTo": 4,           // 进化后的精灵ID
    "evolveLevel": 16,        // 进化等级
    "method": "levelUp"       //进化方法: levelUp/item/friendship/happiness/trade/special
  },
  "baseStats": {
    "hp": 45,                 // 生命值
    "attack": 49,             // 物理攻击
    "defense": 49,            // 物理防御
    "spAttack": 65,           // 特殊攻击
    "spDefense": 65,          // 特殊防御
    "speed": 45               // 速度
  },
  "ability": ["茂盛"],        // 特性（V2实现）
  "learnset": [                // 可学技能列表
    {"skillId":"tackle","level":1},
    {"skillId":"vineWhip","level":5}
  ],
  "habitat": "碧波森林",       // 栖息地
  "description": "青叶镇附近常见的灵兽..." // 描述
}
```

## 5.2 御三家（初始三选一）—— V1 必做

### 🌱 草系御三家：灵叶兽 → 青岚兽 → 苍穹龙狮

```json
{"id":1,"name":"灵叶兽","nameEn":"LeafSpirit","types":["grass"],"evolution":{"evolvesTo":2,"evolveLevel":16,"method":"levelUp"},"baseStats":{"hp":45,"attack":52,"defense":43,"spAttack":60,"spDefense":50,"speed":45},"ability":["叶绿素"],"habitat":"青叶镇周边","description":"形似小鹿的草系灵兽，头顶长有嫩叶。性格温顺，喜食阳光。"}

{"id":2,"name":"青岚兽","nameEn":"AzureMist","types":["grass"],"evolution":{"evolvesTo":3,"evolveLevel":32,"method":"levelUp"},"baseStats":{"hp":60,"attack":67,"defense":58,"spAttack":85,"spDefense":70,"speed":55},"ability":["叶绿素"],"habitat":"—","description":"体表生出青色鳞片，能召唤薄雾掩护自己。"}

{"id":3,"name":"苍穹龙狮","nameEn":"SkyLion","types":["grass","dragon"],"evolution":null,"baseStats":{"hp":80,"attack":95,"defense":75,"spAttack":110,"spDefense":85,"speed":80},"ability":["压迫感"],"habitat":"—","description":"传说中的灵兽进化形态。身披苍翠之甲，鬃毛如云，能呼风唤雨。"}
```

### 🔥 火系御三家：焰纹雀 → 烈翼鹏 → 煌炎凤

```json
{"id":4,"name":"焰纹雀","nameEn":"EmberFinch","types":["fire"],"evolution":{"evolvesTo":5,"evolveLevel":16,"method":"levelUp"},"baseStats":{"hp":42,"attack":58,"defense":40,"spAttribute":62,"spDefense":48,"speed":65},"attribute":["猛火"],"habitat":"赤岩古道","description":"羽毛上带有火焰纹路的小鸟，体温常年偏高。"}

{"id":5,"name":"烈翼鹏","nameEn":"BlazeRoc","types":["fire"],"evolution":{"evolvesTo":6,"evolveLevel":32,"method":"levelUp"},"baseStats":{"hp":58,"attack":78,"defense":55,"spAttack":85,"spDefense":60,"speed":80},"attribute":["猛火"],"habitat":"—","description":"翅膀完全燃烧着火焰，飞行时拖出长长的火尾。"}

{"id":6,"name":"煌炎凤","nameEn":"SolarPhoenix","types":["fire","flying"],"evolution":null,"baseStats":{"hp":75,"attack":105,"defense":68,"spAttack":120,"spDefense":80,"speed":95},"attribute":["压迫感"],"habitat":"—","description":"浴火重生的神鸟后裔。翅展可达三丈，所到之处冬去春来。"}
```

### 🌍 土系御三家：岩地豚 → 磐甲犀 → 泰坦巨像

```json
{"id":7,"name":"岩地豚","nameEn":"RockMole","types":["ground"],"evolution":{"evolvesTo":8,"evolveLevel":16,"method":"levelUp"},"baseStats":{"hp":55,"attack":48,"defense":55,"spAttribute":30,"spDefense":40,"speed":35},"attribute":["沙隐"],"habitat":"废弃矿坑外","description":"在土中打洞的小型灵兽，鼻子能嗅到地下矿物。"}

{"id":8,"name":"磐甲犀","nameEn":"StoneRhino","types":["ground","rock"],"evolution":{"evolvesTo":9,"evolveLevel":32,"method":"levelUp"},"baseStats":{"hp":80,"action":72,"defense":85,"spAttribute":40,"spDefense":60,"speed":40},"attribute":["坚硬脑袋"],"habitat":"—","description":"皮肤石化成盔甲，冲锋时可击碎巨石。"}

{"id":9,"name":"泰坦巨像","nameEn":"TitanGolem","types":["ground","rock"],"evolution":null,"baseStats":{"hp":110,"attack":100,"defense":130,"spAttribute":50,"spDefense":80,"speed":30},"attribute":["沙暴"],"habitat":"—","description":"大地本身的意志具现化。不动如山，动则地震山摇。"}
```

## 5.3 V1 野外精灵（22种）—— 分布在各区域

### 路边常见精灵（青叶野外 / 碧波森林）

```json
{"id":10,"name":"萤火虫","nameEn":"GlowWorm","types":["electric"],"evolution":{"evolvesTo":11,"evolveLevel":12,"method":"levelUp"},"baseStats":{"hp":35,"attack":40,"defense":30,"spAttack":55,"spDefense":40,"speed":70},"habitat":"夜间全域","description":"尾部发光的小虫，成群出现时如同流动的星河。"}

{"id":11,"name":"雷光蝶","nameEn":"VoltMoth","types":["electric","bug"],"evolution":null,"baseStats":{"hp":55,"attack":45,"defense":50,"spAttack":85,"spDefense":60,"speed":90},"habitat":"—","description":"翅膀摩擦产生电流的美丽昆虫。雷雨天后最活跃。"}
```

```json
{"id":12,"name":"小石灵","nameEn":"PebbleSprite","types":["rock"],"evolution":{"evolvesTo":13,"evolveLevel":18,"method":"levelUp"},"baseStats":{"hp":50,"defense":45,"spDefense":70,"spAttack":30,"spDefense":50,"speed":25},"habitat":"山地/洞穴","description":"由岩石中诞生的最原始的灵体。喜欢晒太阳。"}

{"id":13,"name":"岩巨人","nameEn":"RockGiant","types":["rock"],"evolution":null,"baseStats":{"hp":80,"attack":70,"defense":100,"spAttack":40,"spDefense":60,"speed":20},"habitat":"—","description":"体型庞大的岩石灵兽，行动缓慢但力量惊人。"}
```

```json
{"id":14,"name":"暗影鼠","nameEn":"ShadowRat","types":["dark"],"evolution":{"evolvesTo":15,"evolveLevel":20,"method":"levelUp"},"baseStats":{"hp":40,"attack":55,"defense":35,"spAttack":40,"spDefense":35,"speed":85},"habitat":"夜间/洞穴","description":"在阴影中穿行的小型灵兽，眼睛发红光。"}

{"id":15,"name":"幽冥狼","nameEn":"NetherWolf","types":["dark"],"evolution":null,"baseStats":{"hp":70,"attack":90,"defense":50,"spAttack":45,"spDefense":50,"speed":80},"habitat":"—","description":"被称为「死神猎犬」的凶猛灵兽。一旦盯上猎物就不会松口。"}
```

### 水域精灵（海上航道 / 礁石群岛）

```json
{"id":16,"name":"水母灵","nameEn":"JellySpirit","types":["water"],"evolution":{"evolvesTo":17,"evolveLevel":15,"method":"levelUp"},"baseStats":{"hp":45,"defense":35,"spDefense":55,"spAttack":60,"spDefense":70,"speed":30},"habitation":"浅海","description":"半透明的水系灵兽，触手能释放微弱电流。"}

{"id":17,"name":"深渊鳗","nameEn":"AbyssEel","types":["water","dark"],"evolution":null,"baseStats":{"hp":65,"attack":85,"defense":50,"spAttribute":70,"spDefense":55,"speed":90},"habitation":"深海","description":"生活在深海的捕食者。能喷出墨汁混淆敌人视野。"}
```

```json
{"id":18,"name":"贝壳精","nameEn":"ShellFairy","types":["water"],"evolution":{"evolvesTo":19,"evolveLevel":22,"method":"levelUp"},"baseStats":{"hp":50,"attack":40,"defense":70,"spAttribute":45,"spDefense":80,"speed":25},"habitation":"礁石海岸"," description":"寄居在古老贝壳中的水灵。壳越老力量越强。"}

{"id":19,"name":"龙龟","nameEn":"DragonTurtle","types":["water","dragon"],"evolution":null,"baseStats":{"hp":100,"attack":70,"defense":90,"spAttribute":70,"spDefense":85,"speed":40},"habitation":"—","description":"传说活了千年的灵龟。背上的花纹会随月相变化。"}
```

### 山地/火焰区域精灵（熔炉山谷 / 废弃矿坑）

```json
{"id":20,"name":"火花犬","nameEmberHound","types":["fire"],"evolution":{"evolvesTo":21,"evolveLevel":18,"method":"levelUp"},"baseStats":{"hp":45,"attack":55,"defense":40,"spAttribute":65,"spDefense":45,"speed":60},"habitation":"火山地带","描述":"全身散发微热的小狗形态灵兽。兴奋时会喷火星。"}

{"id":21,"name":"烈焰豹","nameInfernoPanther","types":["fire"],"evolution":null,"baseStats":{"hp":70,"attack":90,"defense":55,"spAttribute":90,"spDefense":60,"speed":95},"habitation":"—","description":"最快的大型火系灵兽之一。奔跑时四蹄燃起烈焰。"}
```

```json
{"id":22,"name":"熔岩蟹","nameLavaCrab","types":["fire","rock"],"evolution":null,"baseStats":{"hp":55,"attack:65,"defense":85,"spAttribute":40,"spDefense":50,"speed":30},"habitation":"熔岩岸边","description":"在熔岩中生活的甲壳类灵兽。钳子温度足以融化铁。"}
```

### 迷雾沼泽专属

```json
{"id":23,"name":"泥潭怪","nameMudBlob","types":["ground"],"evolution":null,"baseStats":{"hp":70,"attack":45,"defense":55,"spAttribute":50,"spDefense":60,"speed":25},"habitation":"沼泽湿地","description":"由淤泥凝聚而成的无定形灵兽。能吸收污染物净化环境。"}
```

### 稀有/特殊精灵（低遇率）

```json
{"id":24,"name":"幻影猫","namePhantomCat","types":["psychic"],"evolution":{"evolvesTo":25,"evolveLevel":25,"method":"levelUp"},"baseStats":{"hp":45,"attack":35,"defense":40,"spAttribute":75,"spDefense":70,"speed":85},"habitation":"迷雾森林深处(稀有)","description":"能短暂隐身的神秘灵兽。据说能看到人心中的秘密。"}

{"id":25,"name":"九命灵猫","nameNineSoulCat","types":["psychic"],"evolution":null,"baseStats":{"hp":70,"attack":55,"defense":60,"spAttribute":115,"spDefense":100,"speed":105},"habitation":"—","description":"拥有九条灵魂之命的传说级灵兽。每失去一条命就会变得更强。"}
```

```json
{"id":26,"name":"铁甲虫","nameIronBeetle","types":["rock","steel"/*钢暂归入rock*/],"evolution":null,"baseStats":{"hp":60,"attack":75,"defense":110,"spAttribute":35,"spDefense":70,"speed":30},"habitation":"矿坑深处(稀有)","description":"外壳如钢铁般坚硬的甲虫。被古人视为护身符。"}
```

## 5.4 V2 新增精灵（24种）

### 第4章：清风原 / 古木森林

```json
{"id":27,"name":"木灵","nameWoodSprit","types":["grass"],"evolution":{"evolvesTo":28,"evolveLevel":14,"method":"levelUp"},"baseStats":{"hp":40,"attack":45,"defense":35,"spAttack":60,"spDefense":55,"speed":50},"habitation":"古木森林","description":"树芽形态的小精灵。春天时会开出小花。"}

{"id":28,"name":"树守","nameTreeGuardian","types":["grass"],"evolution":{"evolvesTo":29,"evolveLevel":30,"method":"levelUp"},"baseStats":{"hp":65,"attack":70,"defense":65,"spAttribute":85,"spDefense":80,"speed":45},"habitation":"—","description":"与古树共生的灵兽。受伤时会在树下恢复体力。"}

{"id":29,"name":"世界树之子","nameYggdrasilSprout","types":["grass","psychic"],"evolution":null,"baseStats":{"hp":95,"attack":85,"defenese":90,"spAttribute":110,"spDefense":115,"speed":50},"habitation":"—","description":"传说中连接天地的世界树的幼苗形态。极其罕见。"}
```

```json
{"id":30,"name":"花仙子","nameFlowerFairy","types":["grass","psychic"],"evolution":null,"baseStats":{"hp":55,"attack:45,"defense":55,"spAttribute":95,"spDefense":95,"speed:80},"habitation":"灵泉秘境","description":"由百花精华凝聚而成的灵体。花香能使周围灵兽平静下来。"}
```

### 第5章：青丘洲（狐族之地）

```json
{"id":31,"name":"小白狐","nameWhiteFoxlet","types":["normal"],"evolution":{"evolvesTo":32,"evolveLevel":15,"method":"levelUp"},"baseStats":{"hp":40,"attack":35,"defense":30,"spAttribute":55,"spDefense":45,"speed":70},"habitation":"青丘洲沿岸","description":"青丘狐族的最幼形态。天生懂得变化之术的基础。"}

{"id":32,"name":"幻狐","nameIllusionFox","types":["dark","psychic"],"evolution":{"evolvesTo":33,"evolveLevel":35,"method":"levelUp"},"baseStats":{"hp":65,"attack":60,"defense":55,"spAttribute":95,"spDefense":85,"speed":100},"habitation":"—","description":"能制造逼真幻觉的狐族战士。在月光下力量倍增。"}

{"id":33,"name":"天狐","nameCelestialFox","types":["dark","psychic"],"evolution":null,"baseStats":{"hp":80,"attack":80,"defense":75,"spAttribute":130,"spDefense":105,"speed":115},"habitation":"—","description":"青丘狐族的最强形态。传说有九条尾巴，能看透人心。"}
```

### 第6章：大荒洲（沙漠遗迹）

```json
{"id":34,"name":"沙蠕虫","nameSandWorm","types":["ground"],"evolution":{"evolvesTo":35,"evolveLevel":20,"method":"levelUp"},"baseStats":{"hp":45,"attack:55,"defense":40,"spAttribute":30,"spDefense":40,"speed":55},"habitation":"沙漠地表","description":"在沙下快速移动的蠕虫。振动敏感度极高。"}

{"id":35,"name":"沙漠皇蛇","nameDesertEmperor","types":["ground","dragon"],"evolution":null,"baseStats":{"hp":85,"attack":100,"defense":65,"spAttribute":60,"spDefense":70,"speed":80},"habitation":"地下古城"," description：「沙漠之王」的称号名不虚传。一张口便能吞噬骆驼。"}
```

```json
{"id":36,"name":"铜人俑","nameBronzeFigurine","types":["rock","fighting"],"evolution":null,"baseStats":{"hp":75,"attack":85,"defense":100,"spAttribute":30,"spDefense":45,"speed":25},"habitation":"古代王陵","description：古代陪葬品中诞生的守护灵。忠实地执行千年前的命令。"}
```

## 5.5 V3 高阶精灵（含神兽）

### 冰原精灵（玄冥洲）

```json
{"id":37,"name":"雪球","nameSnowball","types":["ice"],"evolution":{"evolvesTo":38,"evolveLevel":18,"method":"levelUp"},"baseStats":{"hp":45,"attack":40,"defense":40,"spAttribute":65,"spDefense":60,"speed":45},"habitation":"雪原","description："团成球形滚动的冰系小精灵。体温在零度以下。"}

{"id":38,"name":"霜巨人","nameFrostGiant","types":["ice"],"evolution":null,"baseStats":{"hp":90,"attack":80,"defense":85,"spAttribute":90,"spDefense":95,"speed":45},"habitation":"—" ,"description："身高三丈的冰雪巨人。呼吸间便能冻结方圆百米。"}
```

### 火山精灵（炎洲）

```json
{"id":39,"name":"岩浆史莱姆","nameMagmaSlime","types":["fire","ground"],"evolution":null,"baseStats":{"hp":70,"attack":55,"defense":75,"spAttribute":80,"spDefense":80,"speed":40},"habitation":"火山内部","description："由液态岩浆构成的变形灵兽。能通过任何缝隙。"}
```

### 传说神兽（不可捕捉/特殊事件获取）

```json
// === 四象神兽（剧情关键） ===
{"id":40,"name":"朱雀·南离","nameVermilionBird","types":["fire","flying"],"evolution":null,"isLegendary":true,"baseStats":{"hp":100,"attack":85,"defense":75,"spAttribute":125,"spDefense":100,"speed":110},"description":"南方之神兽。象征重生与光明。羽翼燃烧永不熄灭。"}

{"id":41,"name":"玄武·北冥","nameBlackTortoise","types":["water","ground"],"evolution":null,"isLegendary":true,"baseStats":{"hp":140,"attack":85,"defense":120,"spAttribute":90,"spDefense":120,"speed":40},"description":"北方之神兽。象征永恒与坚韧。背负天地之柱碎片。"}

{"id":42,"name":"青龙·东震","nameAzureDragon","types":["grass","dragon"],"evolution":null,"isLegendary":true,"baseStats":{"hp":100,"attack":110,"defense":80,"spAttribute":120,"spDefense":90,"speed":100},"description":"东方之神兽。象征生命与成长。其吐息可使枯木逢春。"}


{"id":43,"name":"白虎·西兑","nameWhiteTiger","types":["steel"/*暂用rock*/,"fighting"],"evolution":null,"isLegendary":true,"baseStats":{"hp":110,"action":140,"defense":80,"spAttribute":70,"spDefense":80,"speed":95},"description":"西方之神兽。象征战争与正义。咆哮可震碎山岳。"}

// === 终极神兽 ===
{"id":44,"name":"混沌·太初","namePrimordialChaos","types":["dark","dragon"],"evolution":null,"isMythical":true,"baseStats":{"hp":150,"attack":140,"defense":100,"spAttribute":150,"sp Defense":120,"speed":110},"description":"创世之前便存在的原初之神。既是毁灭也是新生。只有灵脉共鸣者才能与之沟通。"}
```

## 5.6 精灵属性分布统计

| 属性 | V1数量 | V2新增 | V3新增 | 总计 |
|------|--------|--------|--------|------|
| 草/木 | 3 | 3 | - | **6** |
| 火 | 3 | - | 1 | **4** |
| 水 | 2 | - | - | **2** |
| 电 | 1 | - | - | **1** |
| 土/地 | 2 | - | 2 | **4** |
| 岩/石 | 2 | - | 1 | **3** |
| 暗/影 | 1 | 1 | - | **2** |
| 龙 | - | 1 | 2 | **3** |
| 灵/超能 | 1 | 2 | - | **3** |
| 普通 | 1 | - | - | **1** |
| 冰 | - | - | 2 | **2** |
| 格斗 | - | 1 | 1 | **2** |
| **总计** | **19** | **11** | **10** | **44(+4神兽)** |

> 注：V1 的 25 只目标已达成（19常规 + 初始3阶×3 = 28只，含部分 V2 编号）。实际 V1 实装建议从 id 1-26 中选取。

---

# 第六部分：NPC 名单

## 6.1 NPC 数据结构

```javascript
// npcs.json 条目结构
{
  "npcId": "npc_mo_bo_shi",        // 唯一ID
  "name": "墨博士",                // 显示名称
  "sprite": "npc_scientist.png",   // 像素画资源名
  "type": "key" | "trainer" | "merchant" | "healer" | "villager",
  "location": "青叶镇·灵师研究所", // 所在地图位置
  "dialogue": {                    // 对话数据（支持条件分支）
    "default": ["欢迎来到灵师研究所！","你是来领取第一只灵兽的吧？"],
    "afterFirstBattle": ["看来你和你的伙伴相处得不错啊。"],
    "postGame": [...]
  },
  "team": [                        // 如果是训练师，其精灵队伍
    {"creatureId": 20, "level": 15}
  ],
  "aiBehavior": "balanced" | "aggressive" | "defensive" | "strategic",
  "reward": {                      // 击败奖励
    "money": 500,
    "exp": 150
  }
}
```

## 6.2 关键角色（剧情核心 NPC）

### 📚 主角相关

| NPC ID | 名称 | 角色 | 性格 | 首次出现 | 说明 |
|--------|------|------|------|---------|------|
| `npc_protagonist` | 主角(玩家) | 灵师 | 由玩家决定 | 第1章 | 默认名「云」，可自定义 |
| `npc_rival` | 阿潮 | Rival | 高傲但正直、好胜心强 | 第1章 | 选择主角弱点的御三家 |
| `npc_father` | 云远 | 主角父亲 | 沉稳、话少、深爱孩子 | 第1章 | 前任灵师公会精英，因故隐退 |
| `npc_mother` | 芸娘 | 主角母亲 | 温柔、隐约担忧 | 第1章 | 普通人，不知丈夫过去 |

### 🔬 灵师公会/研究者

| NPC ID | 名称 | 角色 | 性格 | 首次出现 | 功能 |
|--------|------|------|------|---------|------|
| `npc_mo_bo_shi` | **墨博士** | 引导NPC | 博学多识、温和幽默 | 青叶镇 | 发放初始精灵、图鉴、任务 |
| `npc_ling_yuan` | **灵渊长者** | 关键剧情角色 | 深沉、言简意赅、神秘 | 第2章末 | 揭示灵脉秘密、主线推进者 |
| `npc_yan_lie` | **炎烈** | 火系道馆馆主 | 热血、直爽、正义感强 | 第3章 | 道馆挑战 + 后续盟友 |

### 👿 反派组织「浊流」

| NPC ID | 名称 | 地位 | 属性倾向 | 首次出现 | 设计 |
|--------|------|------|---------|---------|------|
| `npc_xu_kong` | **虚空** | 首领 | 全属性(暗为主) | 第7章 | 灵渊长老的弟弟，理念极端 |
| `npc_lang` | **浪** | 干部 | 水/暗 | 第1章 | 小头目，伪装成训练师 |
| `npc_shuang` | **霜** | 干部 | 冰/灵 | 第2章 | 冷酷理性，认为秩序高于一切 |
| `npc_yan_t` | **焱** | 干部 | 火/龙 | 第3章 | 暴躁激进，崇尚力量至上 |
| `npc_wu` | **雾** | 干部 | 幻/暗 | 第5章 | 狐族叛徒，善于操纵人心 |
| `npc_yan_g` | **岩** | 干部 | 岩/钢 | 第6章 | 沉默寡言，绝对执行者 |
| `npc_grunt_#` | 浊流杂兵 | 一般成员 | 多样 | 全程 | 重复使用3-4种外观模板 |

### ⚔️ 道馆馆主（8位）

| 编号 | 名称 | 道馆 | 属性 | 城市 | 徽章名 | 性格特点 |
|------|------|------|------|------|--------|---------|
| G1 | **澜汐** | 碧波道馆 | 水 | 碧波镇 | 碧波徽章 | 温柔坚定，像大姐姐 |
| G2 | **炎烈** | 炎阳道馆 | 火 | 炎阳城 | 烈阳徽章 | 热血青年，说话大声 |
| G3 | **青萝** | 牧云道馆 | 草 | 牧云城 | 青云徽章 | 文静知性，爱读书 |
| G4 | **月华** | 月华宫道馆 | 灵/超能 | 青丘洲 | 幻月徽章 | 狐族公主，优雅神秘 |
| G5 | **铁山** | 大荒道馆 | 岩/地 | 绿洲城 | 磐石徽章 | 老兵风格，不苟言笑 |
| G6 | **霜寒** | 极光道馆 | 冰 | 冰原城 | 极光徽章 | 冷艳高傲，少言寡语 |
| G7 | **龙渊** | 龙巢道馆 | 龙 | 炎神殿 | 龙魂徽章 | 孤傲强者，追求极致 |
| G8 | **（冠军）** | — | 混合 | 联盟 | 冠军徽章 | （阿潮） |

## 6.3 功能性 NPC（城镇常驻）

### 商人列表

| NPC ID | 名称 | 类型 | 位置 | 特色商品 |
|--------|------|------|------|---------|
| `merchant_general` | 货郎老黄 | 综合商店 | 碧波镇 | 基础球药、解毒药等 |
| `merchant_ball` | 球匠阿牛 | 精灵球专卖 | 炎阳城 | 各类高级球 |
| `merchant_secret` | 行商「无影」 | 黑市商人 | 隐藏地点 | 稀有道具、高价 |
| `merchant_tm` | 技能导师 | 技能传授 | 主要城市 | 秘传技能机 |

### 治疗/服务 NPC

| NPC ID | 名称 | 服务 | 位置 | 特殊功能 |
|--------|------|------|------|---------|
| `healer_clinic` | 杏林医仙 | 免费全恢复 | 各城镇医疗所 | 治疗全部状态异常 |
| `pc_box` | 电脑终端 | 存取精灵 | 灵师中心 | PC系统（存取多余精灵）|
| `npc_daycare` | 灵兽保姆 | 寄养升级 | 牧云城 | V2实现寄养系统 |

## 6.4 路人/氛围 NPC（每个城镇 3-5 个）

### 青叶镇路人

| NPC ID | 名称 | 对话示例 | 作用 |
|--------|------|---------|------|
| `villager_01` | 张大妈 | 「我家小明也去当灵师了，也不知道在外面怎么样…」| 氛围/情感 |
| `villager_02` | 小明的小伙伴 | 「听说碧波镇那边最近有怪事发生！」| 剧情提示 |
| `villager_03` | 钓鱼大爷 | 「这河里的鱼越来越少了…」| 暗示环境变化 |

### 碧波镇路人

| NPC ID | 名称 | 对话示例 |
|--------|------|---------|
| `villager_04` | 港口船夫 | 「海上的浪最近特别大，不知道怎么回事。」|
| `villager_05` | 游客少女 | 「碧波镇的夜景真的太美了！」|

> 每个 V1 城镇设计 3-4 个路人 NPC，对话随剧情进展更新。

## 6.5 野外训练师模板

野外训练师按类型分为以下模板，每种有 3-4 个变体：

```javascript
const TRAINER_TEMPLATES = {
  YOUNGSTER: {     // 少年训练师
    sprite: "trainer_boy.png",
    aiBehavior: "random",
    teamSize: 1-2,
    levelRange: [3, 8],
    reward: { money: 40-80, exp: 20-50 },
    dialogue: { before: "嘿！来对战吧！", after: "你真强…" }
  },
  LASS: {          // 少女训练师
    sprite: "trainer_girl.png",
    aiBehavior: "balanced",
    teamSize: 1-2,
    levelRange: [4, 9],
    reward: { money: 48-96, exp: 24-60 },
    dialogue: { before: "我的精灵可不弱的！", after: "还要再练习呢…" }
  },
  HOOLIGAN: {      // 小混混（浊流外围）
    sprite: "trainer_thug.png",
    aiBehavior: "aggressive",
    teamSize: 1-3,
    levelRange: [5, 12],
    reward: { money: 60-120, exp: 35-70 },
    dialogue: { before: "喂，看你很不顺眼啊。", after: "可恶…" }
  },
  ACE_TRAINER: {   // 精英训练师
    sprite: "trainer_ace.png",
    aiBehavior: "strategic",
    teamSize: 2-4,
    levelRange: [10, 25],
    reward: { money: 200-500, exp: 100-300 },
    dialogue: { before: "让我看看你的实力。", after: "不错的战斗。" }
  },
  DOUBLE_BATTLE: { // 双人对战（V2）
    sprite: ["trainer_a.png", "trainer_b.png"],
    aiBehavior: "coordinated",
    teamSize: "2v2 (each 1-3)",
    levelRange: [15, 30],
    dialogue: { before: "双人合击！", after: "配合得不错嘛。" }
  }
};
```

---

# 第七部分：技能库设计（86个）

## 7.1 技能数据结构

```javascript
{
  "skillId": "ember",           // 唯一ID（驼峰命名）
  "name": "火花",               // 中文名
  "nameEn": "Ember",            // 英文名
  "type": "fire",               // 属性
  "category": "special",        // 类别: physical / special / status
  "power": 40,                  // 威力 (0=无伤害)
  "accuracy": 100,              // 命中率 (%)
  "pp": 25,                     // 使用次数
  "priority": 0,                // 先制等级 (负=后手, 正=先手)
  "effect": null | {            // 附加效果
    "chance": 10,               // 触发概率(%)
    "status": "burn",           // 附加状态
    "statChange": {             // 能力变化
      "target": "self" | "opponent",
      "stats": { "attack": -1 } // 变化值（正=上升，负=下降）
    }
  },
  "description": "向对手喷射小火焰，有时会造成烧伤。" // 描述
}
```

## 7.2 普通属性技能 (NORMAL) —— 基础通用

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| tackle | 撞击 | physical | 40 | 100 | 35 | 无 | V1 |
| growl | 吠叫 | status | 0 | 100 | 40 | 对手攻击-1 | V1 |
| tailWhip | 摇尾巴 | status | 0 | 100 | 30 | 对手防御-1 | V1 |
| stringShot | 吐丝 | status | 0 | 95 | 40 | 对手速度-2 | V1 |
| quickAttack | 电光一闪 | physical | 40 | 100 | 30 | 先制+1 | V1 |
| slam | 拍击 | physical | 80 | 75 | 20 | 无 | V1 |
| hyperBeam | 破坏光线 | special | 150 | 90 | 5 | 下回合不能行动 | V1 |
| swordDance | 剑舞 | status | 0 | — | 20 | 自身攻击+2 | V2 |
| protect | 保护 | status | 0 | — | 10 | 本回合免疫伤害(连续使用成功率递减)| V2 |
| facade | 替面目 | physical | 70 | 100 | 20 | 自身状态异常时威力翻倍 | V2 |
| rest | 睡觉 | status | 0 | — | 10 | 自身HP全回复+睡眠状态 | V2 |
| snore | 打鼾 | special | 50 | 100 | 15 | 睡眠时可用，30%让对方畏缩 | V2 |
| charm | 可爱 | status | 0 | 100 | 20 | 对手攻击-2 | V2 |
| fakeOut | 假动作 | physical | 40 | 100 | 10 | 先制+1，必定畏缩(每场一次)| V2 |

## 7.3 火属性技能 (FIRE)

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| ember | 火花 | special | 40 | 100 | 25 | 10%烧伤 | V1 ✅已有 |
| fireSpin | 火焰旋涡 | special | 35 | 85 | 15 | 束缚4-5回合(每回合损1/8HP)| V1 |
| flamethrower | 喷射火焰 | special | 90 | 100 | 15 | 10%烧伤 | V2 |
| fireBlast | 大字爆炎 | special | 110 | 85 | 5 | 10%烧伤 | V2 |
| willOWisp | 鬼火 | status | 0 | 85 | 15 | 对手烧伤 | V2 |
| sunnyDay | 大晴天 | status | 0 | — | 5 | 天气变为晴天5回合 | V2 |
| heatWave | 热风 | special | 95 | 90 | 10 | 10%烧伤 | V2 |
| inferno | 劫火 | special | 100 | 50 | 5 | 必定烧伤 | V3 |
| flareBlitz | 闪耀火焰 | physical | 120 | 100 | 15 | 1/3反弹伤害给自身，10%烧伤 | V3 |
| overheat | 过热 | special | 130 | 90 | 5 | 使用后自身特攻降2级 | V3 |

## 7.4 水属性技能 (WATER)

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| waterGun | 水枪 | special | 40 | 100 | 25 | 无 | V1 ✅已有 |
| bubble | 泡泡 | special | 40 | 100 | 30 | 10%对手速度-1 | V1 |
| bubbleBeam | 泡沫光线 | special | 65 | 100 | 20 | 10%对手速度-1 | V1 |
| surf | 冲浪 | special | 90 | 100 | 15 | 战斗外可在水面移动 | V2 |
| hydroPump | 水炮 | special | 110 | 80 | 5 | 无 | V2 |
| rainDance | 求雨 | status | 0 | — | 5 | 天气变为大雨5回合 | V2 |
| aquaRing | 水之环 | status | 0 | — | 20 | 每回合回复1/16HP | V2 |
| muddyWater | 浊流 | special | 90 | 85 | 10 | 30%对手命中降1级 | V3 |
| waterfall | 瀑布 | physical | 80 | 100 | 15 | 20%对方畏缩 | V3 |

## 7.5 草属性技能 (GRASS)

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| vineWhip | 藤鞭 | physical | 45 | 100 | 25 | 无 | V1 ✅已有 |
| razorLeaf | 飞叶快刀 | physical | 55 | 95 | 25 | 必定暴击 | V1 |
| leechSeed | 寄生种子 | status | 0 | 90 | 10 | 每回合吸取对方1/8HP | V1 |
| growth | 自然之力 | status | 0 | — | 20 | 自身攻防各+1(V2改为特攻特防)| V1 |
| solarBeam | 太阳光线 | special | 120 | 100 | 10 | 需蓄力1回合(晴天免蓄力)| V2 |
| sleepPowder | 催眠粉 | status | 0 | 75 | 15 | 对手睡眠 | V2 |
| spore | 孢子 | status | 0 | 100 | 15 | 对手睡眠(比催眠粉准但学习面窄)| V2 |
| gigaDrain | 超级吸收 | special | 75 | 100 | 10 | 给予伤害的1/2回复自身HP | V2 |
| grassWhisper | 草之耳语 | status | 0 | — | 15 | 自身特攻+特防+1 | V3原创 |
| seedBomb | 种子炸弹 | physical | 80 | 100 | 15 | 无 | V3 |

## 7.6 电属性技能 (ELECTRIC)

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| thunderShock | 电击 | special | 40 | 100 | 30 | 10%麻痹 | V1 ✅已有 |
| spark | 电光 | physical | 65 | 100 | 20 | 30%麻痹 | V1 |
| thunderWave | 电磁波 | status | 0 | 90 | 20 | 对手麻痹 | V1 |
| thunderbolt | 十万伏特 | special | 90 | 100 | 15 | 10%麻痹 | V2 |
| thunder | 打雷 | special | 110 | 70 | 10 | 30%麻痹(雨天必中)| V2 |
| charge | 充电 | status | 0 | — | 20 | 下回合电系招式威力x2+特防+1| V2 |
| discharge | 放电 | special | 80 | 100 | 15 | 30%麻痹队友也会受影响 | V2 |
| wildCharge | 疯狂电压 | physical | 90 | 100 | 15 | 1/3反弹伤害 | V3 |
| voltSwitch | 急速折返 | special | 70 | 100 | 20 | 攻击后切换精灵 | V3 |

## 7.7 土/地属性技能 (GROUND)

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| sandAttack | 扬沙 | status | 0 | 100 | 15 | 对手命中-1 | V1 |
| mudSlap | 扔泥 | special | 20 | 100 | 10 | 对手命中-1 | V1 |
| earthquake | 地震 | physical | 100 | 100 | 10 | 对全体精灵有效 | V2 |
| dig | 挖洞 | physical | 80 | 100 | 10 | 首回合钻地(无敌)，次回合攻击 | V2 |
| magnitude | 震级 | physical | — | 100 | 30 | 威力随随机数变化(10-150)| V2 |
| sandstorm | 扬沙暴 | status | 0 | — | 10 | 天气沙暴5回合(岩石系除外每回合扣血)| V2 |
| earthPower | 大地之力 | special | 90 | 100 | 10 | 10%特防-1 | V3 |
| precipiceBlades | 大地双刃 | physical | 120 | 85 | 10 | 对全体敌方有效 | V3 |
| rockSmash | 碎岩 | physical | 40 | 100 | 15 | 50%防御-1;战外可碎岩石 | V2 |

## 7.8 岩石属性技能 (ROCK)

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| rockThrow | 落石 | physical | 50 | 90 | 15 | 无 | V1 ✅已有 |
| rollout | 滚动 | physical | 30 | 90 | 20 | 连续攻击5回合威力翻倍 | V2 |
| rockSlide | 岩崩 | physical | 75 | 90 | 10 | 30%畏缩 | V2 |
| stealthRock | 隐形岩 | status | 0 | — | 20 | 设置换入场受伤的岩阵 | V2 |
| stoneEdge | 尖石攻击 | physical | 100 | 80 | 5 | 必定暴击率高 | V3 |
| rockPolish | 磨砺 | status | 0 | — | 20 | 自身速度+2 | V3 |

## 7.9 冰属性技能 (ICE) —— V2新增

| skillId | 名称 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|----|------|-------|
| powderSnow | 细雪 | special | 40 | 100 | 25 | 10%冰冻 | V2 |
| iceBeam | 暴风雪 | special | 90 | 100 | 10 | 10%冰冻 | V2 |
| blizzard | 暴风雪 | special | 110 | 70 | 5 | 10%冰冻(暴雪天必中)| V2 |
| icyWind | 冷风 | special | 55 | 95 | 15 | 对手速度必降1级 | V2 |
| hail | 冰雹 | status | 0 | — | 10 | 天气冰雹5回合 | V2 |

## 7.10 龙/暗/灵/格斗属性技能 (DRAGON/DARK/PSYCHIC/FIGHTING) —— V2-V3

| skillId | 名称 | 属性 | 类别 | 威力 | 命中 | PP | 效果 | V阶段 |
|---------|------|------|------|------|------|----|------|-------|
| dragonRage | 龙怒 | dragon | special | — | 100 | 10 | 固定40点伤害 | V2 |
| dragonBreath | 龙息 | dragon | special | 60 | 100 | 20 | 30%麻痹 | V2 |
| dragonClaw | 龙爪 | dragon | physical | 80 | 100 | 15 | 无 | V2 |
| dracoMeteor | 流星群 | dragon | special | 130 | 90 | 5 | 自身特攻降2级 | V3 |
| bite | 咬住 | dark | physical | 60 | 100 | 25 | 30%畏缩 | V1 |
| crunch | 咬碎 | dark | physical | 80 | 100 | 15 | 20%防御-1 | V2 |
| darkPulse | 恶之波动 | dark | special | 80 | 100 | 15 | 20%畏缩 | V2 |
| nightSlash | 暗袭要害 | dark | physical | 70 | 100 | 15 | 必定暴击率高 | V3 |
| foulPlay | 假动作欺诈 | dark | physical | 95 | 100 | 15 | 利用对手攻击力计算伤害 | V3 |
| confuseRay | 幻象光线 | psychic | status | 0 | 100 | 10 | 对手混乱 | V2 |
| psychic | 念力 | psychic | special | 90 | 100 | 10 | 10%特防-1 | V2 |
| calmMind | 冥想 | psychic | status | 0 | — | 20 | 自身特攻+特防+1 | V2 |
| shadowBall | 影球 | ghost/*dark*/ special | 80 | 100 | 15 | 20%特防-1 | V2 |
| dreamEater | 食梦 | psychic | special | 100 | 100 | 15 | 仅对睡眠中有效，回1/2HP | V2 |
| karateChop | 手刀 | fighting | physical | 50 | 100 | 25 | 必定暴击率高 | V2 |
| brickBreak | 碎瓦 | fighting | physical | 75 | 100 | 15 | 破除光墙/反射壁 | V2 |
| closeCombat | 近身格斗 | fighting | physical | 120 | 100 | 5 | 使用后自身防/特防各降1级 | V3 |
| focusBlast | 气合弹 | fighting | special | 120 | 70 | 5 | 10%特防-1 | V3 |

## 7.11 技能数量统计

| 分类 | 数量 | V1 | V2新增 | V3新增 |
|------|------|-----|--------|--------|
| 普通(Normal) | 14 | 6 | 6 | 2 |
| 火(Fire) | 10 | 2 | 4 | 4 |
| 水(Water) | 9 | 3 | 4 | 2 |
| 草(Grass) | 10 | 5 | 4 | 1 |
| 电(Electric) | 9 | 3 | 4 | 2 |
| 土/地(Ground) | 9 | 2 | 4 | 3 |
| 岩(Rock) | 6 | 1 | 3 | 2 |
| 冰(Ice) | 5 | - | 5 | - |
| 龙(Dragon) | 5 | - | 3 | 2 |
| 暗(Dark) | 5 | 1 | 2 | 2 |
| 灵(Psychic) | 5 | - | 4 | 1 |
| 格斗(Fighting) | 5 | - | 2 | 3 |
| **总计** | **~97个** | **~23个** | **~45个** | **~24个** |

> **V1建议**: 从现有26个基础上精选到35-40个，确保每个属性至少有3-4个可用技能。

---

# 第八部分：物品库设计（48种）

## 8.1 物品数据结构

```javascript
{
  "itemId": "potion",           // 唯一ID
  "name": "恢复药水",           // 显示名称
  "nameEn": "Potion",           // 英文名
  "category": "medicine" | "ball" | "key" | "holdItem" | "battle",
  "description": "回复精灵50点HP。", // 描述
  "price": 300,                 // 购买价格 (0=不可购买)
  "sellPrice": 150,             // 出售价格(通常为半价)
  "effect": {                   // 使用效果
    "type": "healHp",
    "value": 50
  },
  "usableIn": ["field","battle"], // 使用场景
  "consumable": true            // 是否消耗品
}
```

## 8.2 精灵球类 (BALL) —— 8种

| itemId | 名称 | 价格 | 捕获率 | 特殊效果 | V |
|--------|------|------|--------|---------|---|
| spiritBall | 灵球 | 200 | 1.0x | 基础球 | V1 ✅ |
| superBall | 超级灵球 | 600 | 1.5x | - | V1 |
| ultraBall | 超级灵球 | 1200 | 2.0x | - | V2 |
| masterBall | 至尊灵球 | 不可买 | 255x | 必定捕获 | V3剧情获得 |
| netBall | 网球 | 500 | 3x(对水/虫系) | - | V2 |
| quickBall | 速攻球 | 1000 | 5x(首回合) | - | V2 |
| timerBall | 时间球 | 1000 | 1-4x(回合数越多越高) | - | V3 |
| healBall | 疗球 | 300 | 1.0x | 捕获后自动满血 | V2 |

## 8.3 回复类药品 (MEDICINE) —— 16种

### HP回复

| itemId | 名称 | 价格 | 效果 | V |
|--------|------|------|------|---|
| potion | 恢复药水 | 300 | 回复HP 20 | V1 ✅ |
| superPotion | 上等药水 | 700 | 回复HP 50 | V1 |
| hyperPotion | 高级药水 | 1200 | 回复HP 200 | V2 |
| maxPotion | 全复药水 | 2500 | 回复HP全部 | V2 |
| fullHeal | 万能药 | 600 | 治愈所有状态异常 | V2 |
| revive | 复活草 | 1500 | 复活一只濒死精灵(HP半) | V2 |
| maxRevive | 完全体复活草 | 4000 | 复活一只(HP全) | V3 |

### 状态治愈

| itemId | 名称 | 价格 | 治愈状态 | V |
|--------|------|------|---------|---|
| antidote | 解毒药 | 100 | 中毒 | V1 |
| burnHeal | 消烧伤喷雾 | 250 | 烧伤 | V1 |
| paralyzeHeal | 麻痹电击治疗 | 200 | 麻痹 | V1 |
| awakening | 苏醒药 | 250 | 睡眠 | V1 |
| iceHeal | 化冰喷雾 | 250 | 冰冻 | V2 |
| cureAll | 全状态净除 | 800 | 所有异常 | V2 |

### 能力增强（战斗中一次性使用）

| itemId | 名称 | 价格 | 效果 | V |
|--------|------|------|------|---|
| xAttack | 攻击强化 | 500 | 战斗中攻击+1 | V2 |
| xDefense | 防御强化 | 550 | 战斗中防御+1 | V2 |
| xSpAttack | 特攻强化 | 500 | 战斗中特攻+1 | V2 |
| xSpeed | 速度强化 | 350 | 战斗中速度+1 | V2 |
| directHit | 必中香炉 | 800 | 本回合技能必中 | V3 |

## 8.4 携带道具 (HOLD ITEM) —— 10种

| itemId | 名称 | 价格 | 效果 | V |
|--------|------|------|------|---|
| expShare | 经验分享器 | 不可买 | 未出场精灵也获经验 | V2 |
| charcoal | 木炭 | 9800 | 火系招式威力+10% | V2 |
| mysticWater | 神秘水滴 | 9800 | 水系招式威力+10% | V2 |
| miracleSeed | 奇迹种子 | 9800 | 草系招式威力+10% | V2 |
| magnet | 磁铁 | 9800 | 电系招式威力+10% | V2 |
| hardStone | 硬石头 | 9800 | 岩系招式威力+10% | V2 |
| neverMeltIce | 不融冰 | 9800 | 冰系招式威力+10% | V3 |
| focusBand | 先攻头巾 | 不可买 | HP不满时防一次致命一击 | V3 |
| leftOvers | 吃剩的东西 | 不可买 | 每回合恢复1/16HP | V3 |
| choiceBand | 讲究头带 | 不可买 | 物攻+50%，只能用第一招 | V3 |

## 8.5 重要钥匙物品 (KEY)

| itemId | 名称 | 获取方式 | 用途 |
|--------|------|---------|------|
| pokedex | 灵图仪 | 墨博士赠送 | 记录精灵信息 |
| townMap | 九州地图 | 家中获得 | 查看已探索区域 |
| bikePermit | 通行令牌 | 碧波镇任务奖励 | 可使用自行车加速移动 |
| badge1-8 | 徽章×8 | 道馆挑战胜利 | 证明实力、解锁功能 |
| spiritCrystal_14 | 四象神器碎片×4 | 剧情获取 | 终章关键道具 |
| oldKey | 古老钥匙 | 废弃矿坑发现 | 开启研究所密室 |
| seaChart | 海图 | 港口船长赠送 | 开启海上航线 |
| secretNote | 浊流笔记 | 击败杂兵掉落 | 揭示反派情报片段 |

## 8.6 战斗辅助道具 (BATTLE) —— 4种

| itemId | 名称 | 价格 | 效果 | V |
|--------|------|------|------|---|
| pokeDoll | 灵兽玩偶 | 1000 | 对野生精灵使用可强制逃跑 | V2 |
| escapeRope | 逃生绳 | 550 | 从洞穴/建筑中瞬间脱出 | V1 |
| repel | 驱避喷雾 | 400 | 100步内不遇弱小野生(V1简化为60秒)| V1 |
| superRepel | 强力驱避 | 700 | 200步内不遇弱小野生 | V2 |

---

# 第九部分：对话库设计

## 9.1 对话数据结构

```javascript
// dialog.json 条目结构 - 支持条件分支和状态机
{
  "dialogueId": "mo_bo_shi_first",
  "speaker": "墨博士",              // 说话人名称
  "sprite": "npc_scientist.png",
  "lines": [                        // 对话行数组
    { "text": "啊，你来了！", "expression": "happy" },
    { "text": "我已经等你很久了。", "expression": "normal" },
    { "text": "来，从这三只灵兽中选择一只作为你的伙伴吧。", "expression": "serious" }
  ],
  "choices": [                       // 可选分支
    {
      "text": "我选草系的！",
      "nextDialogue": "choose_grass",
      "condition": null
    },
    {
      "text": "我选火系的！",
      "nextDialogue": "choose_fire",
      "condition": null
    },
    {
      "text": "我选土系的！",
      "nextDialogue": "choose_ground",
      "condition": null
    }
  ],
  "trigger": {                       // 触发条件
    "flag": "has_started_game",
    "value": false
  }
}
```

## 9.2 关键剧情对话

### 🏠 第1章：出发之日（青叶镇·灵师研究所）

```
对话ID: quest_start
场景: 主角走进研究所
参与: 墨博士、主角

[墨博士]:
「{playerName}！你今天16岁了。」
「按照灵师公会的规定，你可以领取第一只灵兽了。」
→ (走到桌前三只精灵球前)

[墨博士]:
「这三只灵兽是中州南部最常见的三种类型。」
「它们各有特点——选择哪一个，决定了你今后的战斗风格。」

(玩家选择精灵后)

[墨博士]:
「很好的眼光！」
「这只{chosenCreature}看起来很喜欢你呢。」
「来，拿着这个——」
(获得 灵图仪)

[墨博士]:
「这是灵图仪，能自动记录你遇到的每一只灵兽。」
「还有这本灵师手册，里面记载了基础知识。」
(获得 灵师手册)

[墨博士]:
「对了，帮我个忙——去碧波镇的澜汐馆主那里。」
「就说是我让她帮你做个…资质测试。」
「顺路也可以看看外面的世界。」
(获得任务: 前往碧波镇)
```

### ⚔️ 第1章：道馆真相揭露

```
对话ID: gym_reveal
场景: 击败冒牌馆主后的密室
参与: 主角、真正馆主澜汐、浊流小头目浪

[澜汐](被绑在椅子上):
「咳咳…你是谁家的孩子？」
「什么？墨博士让你来的？」

[浪](捂着伤口后退):
「啧…没想到这小鬼不好对付。」
「不过你们来得太晚了。」

[澜汐]:
「浪？！你竟然投靠了浊流…」
「你不是我的见习生吗！」

[浪]:
「哈！馆主，您太天真了。」
「浊流承诺给我力量——真正的力量。」
「而不是在这小镇道馆里浪费人生。」

[浪](转身逃跑):
「后会无期，小鬼。下次见面，我可不会这么客气。」
(浪逃离)

[澜汐](被解绑):
「谢谢你，孩子。」
「浊流…他们比想象中更危险。」
「其他几个地区的道馆也收到了『合作邀请』。」
「如果他们也像这里一样被渗透…」
(获得 碧波徽章)
(获得任务: 警告其他地区)
```

### 💫 第2章：灵渊长老的揭示

```
对话ID: truth_reveal
场景: 云溪镇·灵渊居·密室
参与: 主角、灵渊长者

[灵渊长者]:
「孩子，你知道为什么你能感知到灵兽的情感吗？」

(选项: 不知道 / 天生的吧?)

[灵渊长者]:
「那叫做——灵脉共鸣。」
「千年前天柱折断时，有极少数人类体内保留了与灵脉共鸣的能力。」
「这种人能够直接与灵兽的灵魂沟通。」

[灵渊长者](望向窗外):
「但这份力量…既是礼物，也是诅咒。」
「浊流的首领『虚空』也在寻找这样的人。」
「他想用共鸣者的能力唤醒某种…不该被唤醒的东西。」

[灵渊长者](转向主角):
「你的父母…云远和芸娘…他们也是灵师。」
「多年前，他们在调查灵脉异常时失踪了。」
「我一直没有告诉你，是因为…」

(阿潮突然闯入)

[阿潮]:
「长老！外面…外面全是浊流的人！」
(遭遇战触发)
```

## 9.3 区域氛围对话文本

### 青叶镇氛围

| NPC | 默认对话 | 雨天对话 | 夜间对话 |
|-----|---------|---------|---------|
| 张大妈 | 「小心路上啊。」 | 「这种天气别出门了。」 | 「这么晚还不回来…」 |
| 小孩 | 「大灵师好厉害！」 | 「我想看彩虹！」 | 「妈妈说有妖怪…」 |
| 渔夫 | 「今天的鱼不错。」 | 「下雨天鱼儿都躲起来了。」 | 「晚上钓鱼才有大货。」 |

### 碧波镇氛围

| NPC | 默认对话 |
|-----|---------|
| 游客 | 「大海真的太美了！」 |
| 水手 | 「最近海上不太平啊。」 |
| 商人 | 「来看看新到的货品！」 |
| 老人 | 「想当年我也当过灵师呢…」 |

### 训练师通用对话模板

```javascript
const TRAINER_DIALOGUES = {
  beforeBattle: [
    "嘿！来对战吧！",
    "我的精灵可是很强的！",
    "让我看看你的实力！",
    "正想找人练练呢！",
    "你看上去很弱啊…"
  ],
  afterWin: [
    "你真强…我输了。",
    "还要再练习呢…",
    "下次一定赢你！",
    "我的精灵…没事吧？",
    "服了服了…"
  ],
  afterLose: [
    "哈哈！太简单了！",
    "回去再修炼几年吧！",
    "差得远呢。",
    "还不错，但还不够。",
    "感谢指教！" // 友善型训练师
  ],
  // 特殊训练师专属台词
  special: {
    RIVAL_FIRST: "哼，你也选了御三家？看我怎么打败你！",
    RIVAL_LOST: "可恶…这次算你运气好！",
    GRUNT: "组织的任务高于一切！",
    ADMIN_DEFEAT: "不…不可能…首领不会原谅我的…"
  }
};
```

---

# 第十部分：地图设计详细规划

## 10.1 地图数据结构

```javascript
{
  "mapId": "qingye_town",           // 唯一ID
  "name": "青叶镇",                 // 显示名称
  "type": "town" | "route" | "dungeon" | "cave" | "building" | "special",
  "region": "中州南部",             // 所属区域
  "chapter": 1,                     // 所属章节
  "width": 40,                      // 格子宽度
  "height": 30,                     // 格子高度
  "tileset": "tileset_village.png", // 图块集
  "bgm": "bgm_town_peaceful.mp3",   // 背景音乐
  "encounters": {                   // 野生精灵 encounter 配置
    "grass": [                      // 草丛 encounter 表
      {"creatureId":10,"minLevel":2,"maxLevel":4,"rate":30},
      {"creatureId":12,"minLevel":2,"maxLevel":3,"rate":25},
      {"creatureId":14,"minLevel":3,"maxLevel":3,"rate":15},
      {"creatureId":24,"minLevel":3,"maxLevel":3,"rate":5} // 稀有
    ]
  },
  "connections": [                  // 连接的相邻地图
    { "mapId":"route_001","direction":"east","exitPos":[0,15],"entryPos":[39,15] }
  ],
  "npcs": ["npc_mo_bo_shi","npc_mother","villager_01","villager_02"],
  "objects": [                      // 地图上的交互对象
    { "type":"sign","pos":[5,8],"text":"青叶镇 —— 灵师启程之地" },
    { "type":"healStation","pos":[20,12] },
    { "type":"shop","pos":[25,10],"shopId":"general" }
  ],
  "weather": "clear" | "rain" | "snow" | "sandstorm",
  "dayNightCycle": true            // 是否受昼夜影响
}
```

## 10.2 V1 完整地图列表（10张）

### 城镇地图 (TOWN) —— 3张

#### T01: 青叶镇 (Qingye Town)
```
┌─────────────────────────────────────┐
│  类型: 出生城镇    大小: 32×24       │
│  BGM: 温馨 peaceful village          │
│  天气: 四季如春                      │
│  特色建筑: 灵师研究所、主角家、医疗所 │
├─────────────────────────────────────┤
│  NPC:                                │
│  • 墨博士(研究所) — 发放初始精灵     │
│  •芸娘(家中) — 母亲角色              │
│  • 张大妈 — 路人                     │
│  • 小明的小伙伴 — 剧情提示           │
│                                     │
│  功能点:                             │
│  • 家: 存档/回复                     │
│  • 医疗所: 免费治疗                  │
│  • 研究所: 核心剧情触发              │
├─────────────────────────────────────┤
│  出口: 东 → Route001(青叶野外)      │
└─────────────────────────────────────┘
```

#### T02: 碧波镇 (Bibo Town)
```
┌─────────────────────────────────────┐
│  类型: 港口城镇    大小: 40×32       │
│  BGM: 海风轻拂                          │
│  天气: 偶尔小雨                      │
│  特色: 码头/道馆/商店街               │
├─────────────────────────────────────┤
│  NPC:                                │
│  • 澜汐(道馆) — 水系馆主(第1徽章)    │
│  • 货郎老黄 — 综合商店               │
│  • 港口船夫 — 交通                   │
│  • 杏林医仙(医疗所) — 治疗           │
│  • 浪(伪装) — 反派伏笔               │
│                                     │
│  功能点:                             │
│  • 道馆 — 第一个挑战目标             │
│  • 商店 — 物品购买                   │
│  • 码头 — V1后期/V2前往海域         │
│  • 医疗所 — 免费全恢复               │
├─────────────────────────────────────┤
│  出口: 西 → Route002                │
│        南 → 碧波港(V1.5)            │
└─────────────────────────────────────┘
```

#### T03: 炎阳城 (Yanyang City) — V1第三章城市
```
┌─────────────────────────────────────┐
│  类型: 山地工业城  大小: 44×36       │
│  BGM: 充满活力 industrial town       │
│  天气: 干燥晴朗                      │
│  特色: 矿山/锻造厂/火系道馆          │
├─────────────────────────────────────┤
│  NPC:                                │
│  • 炎烈(道馆) — 火系馆主(第2徽章)    │
│  • 球匠阿牛 — 精灵球专卖             │
│  • 老矿工 — 剧情线索                 │
│                                     │
│  功能点:                             │
│  • 道馆 — 第二个徽章挑战             │
│  • 精灵球店 — 高级球购买             │
│  • 矿坑入口 — 第三章核心区域         │
├─────────────────────────────────────┤
│  出口: 南 → Route004(赤岩古道)      │
│        西 → 废弃矿坑(dungeon)       │
└─────────────────────────────────────┘
```

### 野外道路 (ROUTE) —— 4张

#### R01: 青叶野外 (Route001)
```
┌─────────────────────────────────────┐
│  类型: 新手道路    大小: 48×20       │
│  BGM: 清新郊外                            │
│  地形: 草地+小溪+少量树木               │
├─────────────────────────────────────┤
│  野生精灵(草丛):                      │
│  • 萤火虫(L2-4) — 30%                │
│  • 小石灵(L2-3) — 25%                │
│  • 暗影鼠(L3-3) — 15%                │
│  • 木灵(L2-4) — 20% (V2)            │
│  • 幻影猫(L3-3) — 10% (稀有!)        │
│                                     │
│  训练师(3人):                        │
│  • 少年训练师 A — 1只 L3-5          │
│  • 少女训练师 B — 1只 L4-5          │
│  • 路人闲聊 C — 纯对话              │
│                                     │
│  采集物: 药草(x3)、解毒草(x1)        │
├─────────────────────────────────────┤
│  西: 青叶镇  东: 碧波森林            │
└─────────────────────────────────────┘
```

#### R02: 碧波森林 (Bibo Forest)
```
┌─────────────────────────────────────┐
│  类型: 森林        大小: 56×40       │
│  BGM: 幽静森林                            │
│  地形: 密林+小径+隐蔽空地              │
│  迷宫度: ★★☆☆☆ (轻度)              │
├─────────────────────────────────────┤
│  野生精灵:                            │
│  • 木灵(L4-6) — 30%                  │
│  • 萤火虫(L4-6) — 25%                │
│  • 暗影鼠(L4-6) — 20%                │
│  • 小石灵(L3-5) — 15%                │
│  • 花仙子(L5-7) — 10% (稀有!)        │
│                                     │
│  训练师(4人):                        │
│  • 少年训练师 ×2                    │
│  • 少女训练师                        │
│  • 捕虫少年(用虫/草系)               │
│                                     │
│  特殊:                              │
│  • 隐藏道具: 精灵球x1                │
│  • 秘密空地: 可遇到稀有小精灵        │
├─────────────────────────────────────┤
│  西: 青叶野外  东: 碧波镇            │
└─────────────────────────────────────┘
```

#### R03: 礁石航道 (Reef Route) — V1.5/V2
```
┌─────────────────────────────────────┐
│  类型: 海上路线    大小: 60×28       │
│  BGM: 波涛汹涌 sea voyage                │
│  地形: 甲板+礁石区                      │
│  特殊: 需要船通行证或剧情解锁          │
├─────────────────────────────────────┤
│  野生(海钓/浅滩):                     │
│  • 水母灵(L8-12) — 35%               │
│  • 贝壳精(L8-11) — 30%               │
│  • 萤火虫(L6-10) — 15%               │
│  • 深渊鳗(L12-15) — 5% (极稀有!)     │
│                                     │
│  训练师(水手/渔夫型, 4-5人)          │
│                                     │
│  剧情:                              │
│  • 海怪事件(安抚/对战)               │
│  • 发现浊流巡逻船                    │
├─────────────────────────────────────┤
│  南: 碧波港  北: 礁石群岛            │
└─────────────────────────────────────┘
```

#### R04: 赤岩古道 (RedRock Path) — V1第三章
```
┌─────────────────────────────────────┐
│  类型: 山地道路    大小: 52×32       │
│  BGM: 苍凉山地                            │
│  地形: 峡谷+岩壁+温泉                   │
│  天气: 偶落火山灰(沙暴效果降命中)      │
├─────────────────────────────────────┤
│  野生精灵:                            │
│  • 小石灵(L12-16) — 30%              │
│  • 岩巨人(L13-17) — 15%              │
│  • 火花犬(L12-15) — 25%              │
│  • 沙蠕虫(L14-16) — 20%              │
│  • 熔岩蟹(L15-18) — 10%              │
│                                     │
│  训练师(登山者/矿工型, 5-6人)        │
│  含1名浊流杂兵(伪装成矿工)           │
│                                     │
│  收集品: 火焰石、硬石头               │
├─────────────────────────────────────┤
│  南: 碧波镇(经山路)  北: 炎阳城      │
└─────────────────────────────────────┘
```

### 特殊区域 (DUNGEON/SPECIAL) —— 3张

#### D01: 迷雾沼泽 (Mist Marsh)
```
┌─────────────────────────────────────┐
│  类型: 沼泽迷宫    大小: 36×36       │
│  BGM: 阴森神秘                            │
│  视野: 受迷雾影响(缩小视野范围)        │
│  迷宫度: ★★★☆☆                       │
├─────────────────────────────────────┤
│  野生精灵:                            │
│  • 泥潭怪(L10-14) — 35%              │
│  • 暗影鼠(L10-14) — 25%              │
│  • 幽冥狼(L12-16) — 15%              │
│  • 水母灵(L10-13) — 20%              │
│  • 九命灵猫(L14-16) — 5% (极稀有!)   │
│                                     │
│  特殊机制:                          │
│  • 泥沼地形: 每步损失1HP             │
│  • 迷雾: 除非持有特定道具否则视野受限 │
│  • 隐藏通道: 需要特定技能通过         │
│                                     │
│  目标: 收集灵晶碎片之一              │
├─────────────────────────────────────┤
│  入口: 碧波镇北偏僻小路              │
│  深处: 灵晶碎片·南                  │
└─────────────────────────────────────┘
```

#### D02: 废弃矿坑 (Abandoned Mine) — V1终局区域
```
┌─────────────────────────────────────┐
│  类型: 地下设施    大小: 64×48(多层) │
│  BGM: 压抑紧张 underground danger        │
│  层数: B1F-B3F (3层)                 │
│  迷宫度: ★★★★☆                       │
├─────────────────────────────────────┤
│  B1F: 矿坑外围                       │
│   • 野生: 岩巨人、铁甲虫、熔岩蟹     │
│   • 训练师: 浊流杂兵×3              │
│   • 收集: 老旧钥匙、矿石             │
│                                     │
│  B2F: 研究所外廊                     │
│   • 野生: 实验体精灵(变异色)         │
│   • 训练师: 浊流研究员×2            │
│   • 文档: 研究日志碎片(剧情)        │
│                                     │
│  B3F: 核心实验室 ← 最终BOSS区域     │
│   • BOSS前恢复点                    │
│   • 浊流干部「焱」BOSS战            │
│   • 自毁倒计时事件                  │
│   • 逃生通道                        │
├─────────────────────────────────────┤
│  入口: 炎阳城西                      │
│  关键道具: 老旧钥匙(从D02获取)      │
└─────────────────────────────────────┘
```

#### D03: 灵渊居秘室 (Lingyuan's Chamber) — 剧情关键
```
┌─────────────────────────────────────┐
│  类型: 剧情    大小: 20×16          │
│  BGM: 古老神秘 ancient secret            │
│  用途: 纯剧情，无战斗(除强制战)      │
├─────────────────────────────────────┤
│  事件:                              │
│  1. 解封仪式(需要3块碎片)           │
│  2. 与灵渊长者对话(大量剧情)        │
│  3. 阿潮闯入                        │
│  4. 浊流突袭战(固定队形战斗)        │
│  5. 获得下一阶段目标指引            │
├─────────────────────────────────────┤
│  入口: 云溪镇隐藏地下室              │
└─────────────────────────────────────┘
```

## 10.3 V2 扩展地图预览（10张）

| 地图ID | 名称 | 类型 | 章节 | 核心内容 |
|--------|------|------|------|---------|
| M04 | 云溪镇 | 城镇 | 2 | 灵渊居所在地、第二道馆候选 |
| M05 | 牧云城 | 城镇 | 4 | 草系道馆(G3)、进化系统开启地 |
| M06 | 灵泉秘境 | 特殊区域 | 4 | 稀有精灵栖息地、隐藏洞穴 |
| M07 | 古木森林 | 森林 | 4 | 迷宫级森林、树守栖息地 |
| M08 | 绿洲城 | 城镇 | 6 | 大荒洲唯一城市、岩系道馆(G5) |
| M09 | 月华宫 | 特殊区域 | 5 | 狐族圣地、灵系道馆(G4) |
| M10 | 幻梦林 | 迷宫 | 5 | 视觉幻象迷宫、天狐栖息 |
| M11 | 古代王陵 | 地下迷宫 | 6 | 多层遗迹、铜人俑出没 |
| M12 | 冰原城 | 城镇 | 7 | 冰系道馆(G6)、极光景观 |
| M13 | 炎神殿 | 特殊区域 | 7 | 龙系道馆(G7)、龙巢 |

## 10.4 地图之间的连接关系总览

```
V1 地图连接:
  青叶镇 ──→ Route001(青叶野外) ──→ 碧波森林 ──→ 碧波镇
                                                    │
                                          ┌─────────┼──────────┐
                                          ↓         ↓          ↓
                                    迷雾沼泽  碧波港(V1.5)  Route004(赤岩古道)
                                                              │
                                                         炎阳城 ──→ 废弃矿坑

V2 新增连接:
  碧波港 ──→ 礁石航道 ──→ 礁石群岛 ──→ 云溪镇(含灵渊居)
  炎阳城 ──→ (北部新路) ──→ 清风原 ──→ 牧云城
  牧云城 ──→ 古木森林 ──→ 灵泉秘境
  (渡海) ──→ 青丘洲沿岸 ──→ 狐妖谷 ──→ 月华宫
  (西行) ──→ 沙漠 ──→ 绿洲城 ──→ 古代王陵
```

---

# 第十一部分：HUD界面设计

## 11.1 主游戏界面布局（探索模式）

```
╔══════════════════════════════════════════╗
║  ┌──────────────────────────────────────┐ ║
║  │           (游戏地图画面)              │ ║
║  │                                      │ ║
║  │         32×24 或更大游戏区域         │ ║
║  │          像素风格俯视角              │ ║
║  │                                      │ ║
║  └──────────────────────────────────────┘ ║
║                                           ║
║  ┌─左下状态栏────┐  ┌─右下快捷栏────┐   ║
║  │ ❤️ Lv15 灵叶兽│  │ [菜单] [背包] │   ║
║  │ HP ████████░░ │  │ [图鉴] [存档] │   ║
║  │ EXP █████░░░░░│  │ 💰 3,250      │   ║
║  │ 📍 青叶镇     │  │ ⚡ ☀️(天气)   │   ║
║  └────────────────┘  └───────────────┘   ║
╚══════════════════════════════════════════╝
```

### 各元素详细规范:

#### 左下状态栏 (Player HUD)
- **精灵头像**: 当前首战精灵的像素头像 (24x24)
- **名称 + 等级**: "灵叶兽 Lv15"
- **HP条**: 绿色渐变条，低于25%时闪烁红色+警告音
- **EXP条**: 蓝色细条位于HP下方，满时触发升级动画
- **位置**: 地图名或区域名（可选）
- **尺寸**: 约120px宽 x 60px高

#### 右下快捷栏 (Quick Actions)
- **菜单按钮**: 打开主菜单（精灵队伍/设置/保存）
- **背包按钮**: 打开物品界面
- **图鉴按钮**: 打开已记录的精灵列表
- **金钱显示**: 当前持有的金币数量
- **天气图标**: 当前天气状态
- **尺寸**: 约100px宽 x 60px高

#### 移动端适配要点:
- 按钮最小触控区域: 44x44px
- 状态栏半透明背景，不遮挡关键游戏信息
- 单手可操作，常用功能在屏幕下半区
- 支持虚拟方向键 + AB键（可选配置）

## 11.2 战斗界面布局

```
╔═══════════════════════════════════════════╗
║  ┌─敌方信息─────────────────────────────┐ ║
║  │  🐺 野生 幽冥狼    Lv12              │ ║
║  │  HP ████████████████████░░  45/52    │ ║
║  └───────────────────────────────────────┘ ║
║                                           ║
║        ╔═════════════════════╗            ║
║        ║                     ║            ║
║        ║   (战斗动画区域)     ║            ║
║        ║   敌方精灵 ← → 我方  ║            ║
║        ║                     ║            ║
║        ╚═════════════════════╝            ║
║                                           ║
║  ┌─我方信息─────────────────────────────┐ ║
║  │  🌿 灵叶兽(Lv15)  青岚兽(Lv14)  ... │ ║
║  │  HP ████████████░░░░  32/45         │ ║
║  └───────────────────────────────────────┘ ║
║                                           ║
║  ┌───────────战斗指令───────────────┐     ║
║  │  [战斗]  [精灵球]  [精灵]  [道具]  │     ║
║  │  [撞击] [藤鞭] [生长] [电光一闪]  │     ║
║  └───────────────────────────────────┘     ║
╚═══════════════════════════════════════════╝
```

### 战斗UI组件清单

| 组件 | 说明 | V1优先级 |
|------|------|---------|
| 敌方HP条 | 顶部显示，含名称/等级/HP值 | 必须 |
| 我方HP条 | 底部显示，含精灵切换滚动 | 必须 |
| 战斗信息区 | 中央区域，精灵像素画+动画 | 必须 |
| 指令面板 | 底部4个主按钮(战斗/球/精灵/道具) | 必须 |
| 技能选择面板 | 点击"战斗"后展开，4个技能位 | 必须 |
| 伤害数字 | 浮动伤害数字(飘字效果) | 必须 |
| 状态图标 | 异常状态小图标(中毒等) | 必须 |
| 经验条 | 战斗结束后弹出经验获得+升级 | 必须 |
| 属性相性提示 | "效果绝佳!"/"效果不佳..." | V1必须 |
| 逃跑进度条 | 野生战中尝试逃跑时的动画 | 必须 |

## 11.3 菜单界面结构

```
主菜单 (Menu)
|-- 精灵队伍 (Party)
|   |-- 查看精灵详情(六维/技能/特性)
|   |-- 排列顺序 / 切换出战精灵
|
|-- 背包 (Bag)
|   |-- 全部物品 / 按分类筛选(药品/球/道具/重要)
|   |-- 使用/丢弃
|
|-- 图鉴 (Dex)
|   |-- 已发现列表(剪影) / 已获取详情
|   |-- 收集进度 X/Total
|
|-- 存档 (Save, 仅安全区域)
|   |-- 存档槽位1-3 + 自动存档
|
|-- 设置 (Options)
|   |-- 音量(BGM/SE) / 文字速度 / 战斗动画开关
|
|-- 玩家卡 (Trainer Card)
    |-- 名字/ID/徽章/图鉴完成度/游戏时间/战绩
```

## 11.4 对话框设计规范

```
- 最多显示2行文字(每行~20中文字)
- 半透明黑色背景 rgba(0,0,0,0.8)
- 白色文字, NPC名称用颜色区分类型
- 底部闪烁箭头">>"提示可继续
- 选择题用圆形选项按钮
- 支持NPC头像显示(可选)
```

## 11.5 商店界面布局

```
商品列表格式:
┌────────┬────────┬─────┬────┐
│ 名称    │ 数量   │ 价格 │ 操作│
├────────┼────────┼─────┼────┤
│ 灵球    │ x1     │ ¥200│ 购买│
│ 超级灵球 │ x1     │ ¥600│ 购买│
│ 恢复药水 │ x1     │ ¥300│ 购买│
└────────┴────────┴─────┴────┘
底部: 当前金钱 | [卖出] [离开]
```

---

# 第十二部分：其他系统与优化建议

## 12.1 存档系统数据结构

```javascript
{
  "version": "1.0.0",
  "player": {
    "name": "云", "money": 3250,
    "badges": ["water"], "playTime": 3600
  },
  "party": [
    {
      "creatureId": 1, "nickname": null, "level": 15,
      "exp": 2450, "currentHp": 32, "status": null,
      "moves": [
        {"skillId":"tackle","pp":30},
        {"skillId":"vineWhip","pp":22},
        {"skillId":"growth","pp":18},
        {"skillId":"quickAttack","pp":28}
      ]
    }
  ],
  "pc": [],                    // PC中的精灵
  "bag": { "potion":5, "spiritBall":10, "antidote":2 },
  "keyItems": ["pokedex","townMap"],
  "flags": {                   // 剧情标志位
    "has_started_game": true,
    "has_chosen_starter": true,
    "defeated_rival_first": true,
    "defeated_gym_1": true,
    "discovered_team_turbulence": true,
    "current_chapter": 2
  },
  "position": {                // 最后存档位置
    "mapId": "bibo_town",
    "x": 20, "y": 12, "direction": "down"
  },
  "pokedexSeen": [1,2,4,7,10,12,14],
  "pokedexCaught": [1,10,12,14]
}
```

**存档策略**: 自动存档(Slot Auto,进城镇时) + 手动存档(3槽) + 云端存档(V2)

## 12.2 V1 必须实现的系统清单

| 系统 | 优先级 | 说明 | 当前状态 |
|------|--------|------|---------|
| 地图场景管理(多地图切换) | P0 | 多地图加载/连接 | 需扩展 |
| 遇敌系统(草丛随机encounter) | P0 | encounter池 + 概率 | 已有基础 |
| 回合制战斗(完善属性克制) | P0 | 克制表完整实现 | 需完善 |
| 捕捉系统(调整公式) | P0 | 平衡捕获率 | 已有基础 |
| 升级/学招系统 | P0 | 升级计算 + 新技能习得 | 需扩展 |
| NPC对话系统(条件分支) | P0 | 多行对话 + 选择 | 需重做 |
| 物品/商店系统 | P1 | 扩充品类到25种 | 需扩展 |
| 道馆挑战流程 | P1 | 训练师序列+馆主BOSS | 新开发 |
| 存档读档 | P1 | JSON本地存储 | 新开发 |
| 图鉴系统增强 | P1 | 见/捕记录+详情 | 需增强 |
| 菜单系统 | P1 | 精灵/背包/图鉴/设置 | 新开发 |
| 进化系统 | -- | V1不做,V2首个任务 | -- |

## 12.3 移动端性能优化(关键!)

| 优化项 | 优先级 | 具体措施 |
|--------|--------|---------|
| Canvas渲染 | **必须** | 用HTML5 Canvas或Pixi.js代替DOM sprite |
| 对象池 | **必须** | 伤害数字/特效粒子预创建复用,避免GC卡顿 |
| 资源预加载 | **必须** | 进新地图前加载tileset和精灵,显示loading |
| 视口裁剪 | **应该** | 只渲染可视区域内的对象(大地图尤其) |
| 精灵图集 | **应该** | 多图合并为一张大图,减少请求和内存碎片 |
| 音频压缩 | **应该** | BGM用MP3采样率22050; 音效用短WAV |
| 按需加载地图 | **应该** | 不全量载入内存,进入时加载离开时释放 |
| 包体控制 | **注意** | 微信主包<=4MB(可分包20MB); 像素画风天然省空间 |

## 12.4 用户体验优化

| 项目 | 说明 |
|------|------|
| 跑步模式 | 按住加速键移动速度x1.5 |
| 快速对话 | 按住跳过键加速文字,已看过的可瞬间跳过 |
| 遇敌频率 | 每15-20步遇一次敌(可调参数) |
| 动画速度 | 设置提供快/正常/慢三档 |
| 自动保存 | 每5分钟或进城镇自动存档 |
| 死亡惩罚 | 输给训练师→回最近医疗所,扣一半钱 |
| 新手引导 | 第1章7个教学节点(移动/对话/菜单/战斗/捕捉/商店/道馆确认) |

## 12.5 技术债务清理建议

| 问题 | 影响 | 建议 |
|------|------|------|
| JS全局作用域 | 可能冲突 | 模块化(import/export)或命名空间封装 |
| 数据文件直接引用 | 数据逻辑耦合 | 抽取DataManager统一管理 |
| 无GameStateMachine | 新增状态困难 | 引入状态机(标题/地图/战斗/菜单/对话框) |
| 战斗无AI配置 | 所有敌人行为相同 | 实现TrainerAI策略模式(random/balanced/aggressive/strategic) |
| 无事件系统 | 扩展困难 | 设计EventBus+TriggerZone系统 |
| 存档无加密 | 可被篡改 | 至少base64编码,V2上云校验 |

## 12.6 V1 开发里程碑路线图

```
Week 1-2: Milestone 1 - 基础框架加固
├── 代码模块化重构
├── GameStateMachine 实现
├── DataManager 统一管理数据
└── NPC对话引擎(条件分支/选择)

Week 3-4: Milestone 2 - 内容填充
├── 精灵数据导入 creatures.json (id 1-26)
├── 技能数据扩充到35-40个
├── 物品数据扩充到25种
├── 3张城镇地图制作
└── 4张野外地图制作

Week 5-6: Milestone 3 - 核心系统
├── 道馆挑战流程(训练师序列+BOSS)
├── 存档/读档系统
├── 图鉴系统增强
├── 菜单系统(精灵/背包/设置)
└── 第1章剧情脚本实现

Week 7-8: Milestone 4 - 打磨发布
├── HUD界面美化
├── 新手引导流程
├── 音效/BGM添加
├── 性能测试(真机)
├── Bug修复
└── V1封板
```

---

# 附录 A：美术资源需求清单(V1)

| 资源类型 | 规格 | 数量 | 备注 |
|---------|------|------|------|
| 地图图块(Tileset) | 16x16 或 32x32 px | 3套(城镇/森林/山地) | 含动画帧 |
| 角色行走图(Charset) | 32x32 px(四向四帧) | ~20个(NPC+主角) | 含男女主版 |
| 精灵战斗正面图(Front) | 64x64+ px | 26只 | 正面朝外 |
| 精灵背面图(Back) | 64x64+ px | 6只(御三家全程) | 我方精灵背对 |
| 精灵图标(Icon) | 32x32 px | 26只 | 菜单/图鉴用 |
| UI界面素材 | 各种尺寸 | 1套 | 对话框/菜单/HUD/血条 |
| 特效粒子 | 逐帧或程序生成 | 10-15种 | 攻击/捕捉/升级 |
| 战斗背景图(BG) | 屏幕尺寸 | 3张 | 草地/洞穴/水面 |
| 音效(SE) | WAV/MP3 | ~20种 | 攻击/受伤/升级/菜单 |
| BGM | MP3 loop | 5-8首 | 城镇/野外/战斗/道馆/BOSS |

> 推荐工具: **Aseprite**(付费专业) / **Piskel**(免费在线) / **Pixelorama**(免费开源)

# 附录 B：策划修订日志

| 版本 | 日期 | 内容 |
|------|------|------|
| V1.0 | 2026-04-15 | 初版完成,全部9大模块输出 |

---

> **文档完**
>
> 本文档总计约 **15,000字**,涵盖从世界观到技术实现的完整蓝图。
> 所有数据均为AI可读的结构化格式,可直接指导开发。
> 下一步: 建议按附录12.6的里程碑路线图推进,从Milestone 1开始。


