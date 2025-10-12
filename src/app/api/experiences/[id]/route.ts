import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

// 获取单个面经详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: experienceId } = await params

    // 如果是demo用户，返回模拟数据
    if (session.user.email === "demo@example.com") {
      const mockExperiences = [
        {
          id: "1",
          userId: session.user.id,
          company: "腾讯",
          questionType: "algorithm",
          questionText: "给定一个数组，找出其中两个数的和等于目标值，返回这两个数的索引。\n\n示例：\n输入：nums = [2,7,11,15], target = 9\n输出：[0,1]\n解释：因为 nums[0] + nums[1] == 9，所以返回 [0, 1]。",
          answerText: "可以使用哈希表来解决这个问题。遍历数组，对于每个元素，计算目标值与当前元素的差值，如果这个差值在哈希表中存在，则找到了答案。\n\n算法步骤：\n1. 创建一个哈希表来存储元素值到索引的映射\n2. 遍历数组中的每个元素\n3. 对于当前元素，计算目标值与当前元素的差值\n4. 检查这个差值是否在哈希表中\n5. 如果存在，返回两个索引；否则将当前元素和索引存入哈希表\n\n时间复杂度：O(n)\n空间复杂度：O(n)\n\n代码实现：\n```python\ndef twoSum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []\n```",
          difficulty: "medium",
          tags: "数组,哈希表,双指针",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          userId: session.user.id,
          company: "字节跳动",
          questionType: "system_design",
          questionText: "设计一个短链接系统，如何保证短链接的唯一性和高可用性？\n\n要求：\n1. 支持将长URL转换为短URL\n2. 支持通过短URL访问原始长URL\n3. 保证短URL的唯一性\n4. 系统需要支持高并发访问\n5. 考虑系统的可扩展性",
          answerText: "短链接系统的核心设计包括URL编码、存储、重定向和缓存几个部分。\n\n## 1. URL编码方案\n- 使用Base62编码（0-9, a-z, A-Z）\n- 6位短码可以支持62^6 ≈ 568亿个唯一短链接\n- 使用雪花算法或数据库自增ID生成唯一标识\n\n## 2. 系统架构\n- 负载均衡器：分发请求\n- 短链接服务：处理编码/解码\n- 数据库：存储映射关系\n- 缓存：Redis存储热点数据\n- CDN：加速重定向响应\n\n## 3. 数据库设计\n```sql\nCREATE TABLE short_urls (\n  id BIGINT PRIMARY KEY,\n  short_code VARCHAR(6) UNIQUE,\n  original_url TEXT NOT NULL,\n  created_at TIMESTAMP,\n  expires_at TIMESTAMP,\n  user_id VARCHAR(50)\n);\n```\n\n## 4. 高可用性保证\n- 数据库主从复制\n- Redis集群\n- 多机房部署\n- 监控和告警系统",
          difficulty: "hard",
          tags: "系统设计,分布式,缓存,数据库",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          userId: session.user.id,
          company: "阿里巴巴",
          questionType: "technical",
          questionText: "Spring Boot的自动配置原理是什么？请详细说明@EnableAutoConfiguration注解的工作机制。",
          answerText: "Spring Boot的自动配置基于@EnableAutoConfiguration注解，通过条件注解和配置类来实现自动装配。\n\n## 核心原理\n\n### 1. @EnableAutoConfiguration注解\n```java\n@Target(ElementType.TYPE)\n@Retention(RetentionPolicy.RUNTIME)\n@Documented\n@Inherited\n@AutoConfigurationPackage\n@Import(AutoConfigurationImportSelector.class)\npublic @interface EnableAutoConfiguration {\n    // ...\n}\n```\n\n### 2. AutoConfigurationImportSelector\n- 扫描META-INF/spring.factories文件\n- 加载所有AutoConfiguration类\n- 根据条件注解过滤配置类\n\n### 3. 条件注解机制\n- @ConditionalOnClass：类路径存在指定类时生效\n- @ConditionalOnMissingBean：容器中不存在指定Bean时生效\n- @ConditionalOnProperty：配置属性满足条件时生效\n- @ConditionalOnWebApplication：Web应用时生效\n\n### 4. 配置类示例\n```java\n@Configuration\n@ConditionalOnClass(DataSource.class)\n@EnableConfigurationProperties(DataSourceProperties.class)\npublic class DataSourceAutoConfiguration {\n    \n    @Bean\n    @ConditionalOnMissingBean\n    public DataSource dataSource(DataSourceProperties properties) {\n        return DataSourceBuilder.create()\n            .url(properties.getUrl())\n            .username(properties.getUsername())\n            .password(properties.getPassword())\n            .build();\n    }\n}\n```\n\n### 5. 启动流程\n1. SpringApplication.run()启动\n2. 加载@EnableAutoConfiguration\n3. 扫描spring.factories\n4. 过滤条件注解\n5. 实例化配置类\n6. 注册Bean到容器",
          difficulty: "medium",
          tags: "Spring Boot,Java,自动配置,注解",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "4",
          userId: session.user.id,
          company: "美团",
          questionType: "behavioral",
          questionText: "描述一次你在项目中遇到的最大挑战，以及你是如何解决的？请使用STAR方法回答。",
          answerText: "## Situation（情况）\n在之前的电商项目中，我们遇到了高并发场景下的性能问题。在双11促销期间，系统响应时间从平时的200ms激增到2秒以上，用户投诉激增，严重影响了用户体验。\n\n## Task（任务）\n作为后端开发负责人，我需要在1周内将系统响应时间降低到500ms以下，确保促销活动顺利进行。\n\n## Action（行动）\n我采取了以下措施：\n\n### 1. 性能分析\n- 使用APM工具定位瓶颈\n- 发现数据库查询是主要瓶颈\n- 80%的慢查询集中在商品详情接口\n\n### 2. 数据库优化\n- 为商品表添加复合索引\n- 优化SQL查询语句\n- 实现读写分离\n\n### 3. 缓存策略\n- 引入Redis缓存热点数据\n- 实现多级缓存（本地缓存+Redis）\n- 设置合理的缓存过期时间\n\n### 4. 代码优化\n- 减少不必要的数据库查询\n- 使用批量查询替代循环查询\n- 实现异步处理非核心逻辑\n\n## Result（结果）\n- 系统响应时间从2秒降低到200ms\n- 数据库查询时间减少70%\n- 双11期间系统稳定运行\n- 用户满意度显著提升\n\n## 学到的经验\n- 性能优化需要系统性思考\n- 监控和指标很重要\n- 提前进行压力测试很关键",
          difficulty: "easy",
          tags: "行为面试,项目管理,性能优化,问题解决",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "5",
          userId: session.user.id,
          company: "百度",
          questionType: "algorithm",
          questionText: "实现一个LRU缓存，要求get和put操作都是O(1)时间复杂度。\n\nLRU (Least Recently Used) 缓存淘汰策略：当缓存空间满时，淘汰最近最少使用的数据。",
          answerText: "LRU缓存可以使用HashMap + 双向链表的数据结构来实现O(1)的get和put操作。\n\n## 数据结构设计\n- HashMap：存储key到节点的映射，实现O(1)查找\n- 双向链表：维护访问顺序，最近访问的节点在头部，最久未访问的节点在尾部\n\n## 核心操作\n\n### 1. 节点定义\n```python\nclass Node:\n    def __init__(self, key=0, value=0):\n        self.key = key\n        self.value = value\n        self.prev = None\n        self.next = None\n```\n\n### 2. LRU缓存实现\n```python\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}  # key -> node\n        \n        # 创建虚拟头尾节点\n        self.head = Node()\n        self.tail = Node()\n        self.head.next = self.tail\n        self.tail.prev = self.head\n    \n    def get(self, key: int) -> int:\n        if key in self.cache:\n            node = self.cache[key]\n            self._move_to_head(node)\n            return node.value\n        return -1\n    \n    def put(self, key: int, value: int) -> None:\n        if key in self.cache:\n            # 更新已存在的节点\n            node = self.cache[key]\n            node.value = value\n            self._move_to_head(node)\n        else:\n            # 创建新节点\n            new_node = Node(key, value)\n            \n            if len(self.cache) >= self.capacity:\n                # 删除尾部节点\n                tail = self._remove_tail()\n                del self.cache[tail.key]\n            \n            self.cache[key] = new_node\n            self._add_to_head(new_node)\n    \n    def _add_to_head(self, node):\n        node.prev = self.head\n        node.next = self.head.next\n        self.head.next.prev = node\n        self.head.next = node\n    \n    def _remove_node(self, node):\n        node.prev.next = node.next\n        node.next.prev = node.prev\n    \n    def _move_to_head(self, node):\n        self._remove_node(node)\n        self._add_to_head(node)\n    \n    def _remove_tail(self):\n        last_node = self.tail.prev\n        self._remove_node(last_node)\n        return last_node\n```\n\n## 时间复杂度\n- get操作：O(1)\n- put操作：O(1)\n\n## 空间复杂度\n- O(capacity)，其中capacity是缓存容量",
          difficulty: "hard",
          tags: "算法,数据结构,哈希表,双向链表",
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "6",
          userId: session.user.id,
          company: "滴滴出行",
          questionType: "technical",
          questionText: "Flutter中的Widget树和Element树的区别是什么？它们是如何协作的？",
          answerText: "Flutter的渲染机制基于三棵树：Widget树、Element树和RenderObject树。\n\n## Widget树（Widget Tree）\n- **不可变对象**：Widget是描述UI的不可变对象\n- **配置信息**：包含UI的配置信息，如颜色、大小、布局等\n- **轻量级**：创建和销毁成本很低\n- **声明式**：描述UI应该是什么样子\n\n## Element树（Element Tree）\n- **Widget的实例化**：Element是Widget在树中的实例\n- **可变状态**：可以持有可变状态\n- **生命周期管理**：负责Widget的创建、更新和销毁\n- **树结构维护**：维护父子关系\n\n## 协作机制\n\n### 1. 构建阶段\n```dart\n// Widget树（声明式）\nContainer(\n  child: Text('Hello')\n)\n\n// Element树（实例化）\nContainerElement -> TextElement\n```\n\n### 2. 更新阶段\n- Widget树发生变化时，Flutter会比较新旧Widget\n- 如果Widget类型相同且key相同，复用Element\n- 如果Widget类型不同，销毁旧Element，创建新Element\n\n### 3. 渲染阶段\n- Element树创建对应的RenderObject\n- RenderObject负责实际的布局和绘制\n\n## 三棵树的关系\n```\nWidget树    ->    Element树    ->    RenderObject树\n(配置)           (实例)              (渲染)\n```\n\n## 性能优化\n- **Widget复用**：相同Widget可以复用Element\n- **局部更新**：只更新变化的Widget\n- **懒加载**：按需创建RenderObject\n\n## 实际应用\n- 使用const构造函数减少Widget重建\n- 合理使用key来优化列表性能\n- 避免在build方法中创建新对象",
          difficulty: "medium",
          tags: "Flutter,移动开发,Widget,渲染机制",
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      const experience = mockExperiences.find(exp => exp.id === experienceId)
      
      if (!experience) {
        return NextResponse.json({ error: "Experience not found" }, { status: 404 })
      }

      return NextResponse.json(experience)
    }

    const experience = await prisma.personalExperience.findFirst({
      where: { 
        id: experienceId,
        userId: session.user.id 
      }
    })

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    return NextResponse.json(experience)
  } catch (error) {
    console.error("Get experience error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 更新面经
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: experienceId } = await params
    const body = await request.json()
    const {
      company,
      questionType,
      questionText,
      answerText,
      difficulty,
      tags
    } = body

    // 如果是demo用户，返回模拟更新后的数据
    if (session.user.email === "demo@example.com") {
      const mockExperiences = [
        {
          id: "1",
          userId: session.user.id,
          company: "腾讯",
          questionType: "algorithm",
          questionText: "给定一个数组，找出其中两个数的和等于目标值，返回这两个数的索引。",
          answerText: "可以使用哈希表来解决这个问题。遍历数组，对于每个元素，计算目标值与当前元素的差值，如果这个差值在哈希表中存在，则找到了答案。时间复杂度O(n)，空间复杂度O(n)。",
          difficulty: "medium",
          tags: "数组,哈希表,双指针",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      const experience = mockExperiences.find(exp => exp.id === experienceId)
      
      if (!experience) {
        return NextResponse.json({ error: "Experience not found" }, { status: 404 })
      }

      // 模拟更新
      const updatedExperience = {
        ...experience,
        company: company || experience.company,
        questionType: questionType || experience.questionType,
        questionText: questionText || experience.questionText,
        answerText: answerText || experience.answerText,
        difficulty: difficulty || experience.difficulty,
        tags: tags || experience.tags,
        updatedAt: new Date().toISOString()
      }

      return NextResponse.json(updatedExperience)
    }

    const experience = await prisma.personalExperience.findFirst({
      where: { 
        id: experienceId,
        userId: session.user.id 
      }
    })

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    const updateData: any = {
      company,
      questionType,
      questionText,
      answerText,
      difficulty
    }
    
    if (tags !== undefined) {
      updateData.tags = tags
    }

    const updatedExperience = await prisma.personalExperience.update({
      where: { id: experienceId },
      data: updateData
    })

    return NextResponse.json(updatedExperience)
  } catch (error) {
    console.error("Update experience error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 删除面经
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: experienceId } = await params

    // 如果是demo用户，返回成功
    if (session.user.email === "demo@example.com") {
      return NextResponse.json({ message: "Experience deleted successfully" })
    }

    const experience = await prisma.personalExperience.findFirst({
      where: { 
        id: experienceId,
        userId: session.user.id 
      }
    })

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    await prisma.personalExperience.delete({
      where: { id: experienceId }
    })

    return NextResponse.json({ message: "Experience deleted successfully" })
  } catch (error) {
    console.error("Delete experience error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
