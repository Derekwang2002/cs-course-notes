## 泛型、接口与菱形语法

```java
List<Integer> values = new ArrayList<>();
Map<String, List<Integer>> groups = new HashMap<>();
Deque<int[]> queue = new ArrayDeque<>();
```

左边声明可用操作，右边选择具体实现。`List`、`Map`、`Deque` 是接口。泛型限制元素类型：`Integer` 是包装类型，`int` 是基本类型，不能写 `List<int>`；但 `int[]` 本身是引用类型，所以 `Deque<int[]>` 合法。右侧的菱形语法 `<>` 让编译器从上下文推断类型参数，不是一个空集合。

泛型默认不协变：`List<Integer>` 不能赋给 `List<Number>`，否则后者塞入 `Double` 会破坏原列表。`List<? extends Number>` 适合读 `Number`，通常不能添加非 `null` 的具体值；`List<? super Integer>` 允许放 `Integer`，但读取只保证 `Object`。确定类型的算法容器不用引入通配符。

类型擦除意味着运行时不保留全部泛型参数信息，不能直接 `new T()` 或 `new List<Integer>[n]`。声明 `List<Integer>[]` 类型的变量本身合法，受限的是直接创建带具体类型参数的泛型数组。邻接表可以使用 `List<List<Integer>>`，避免泛型数组的未经检查转换。

<a id="tpl-generic-stack"></a>

**泛型类：同一份栈实现装不同类型**

栈只承诺“最后放入的先取出”。这个约束只关乎顺序，因此可以把元素类型留作参数：存入字符串的栈取回字符串，存入整数的栈取回整数。示例先弹出 write；再弹一次会得到 read，第三次弹出才会触发空栈异常。

```python
from typing import Generic, TypeVar

T = TypeVar("T")


class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()


jobs = Stack[str]()
jobs.push("read")
jobs.push("write")
print(jobs.pop())  # write
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    static final class Stack<T> {
        private final Deque<T> items = new ArrayDeque<>();

        void push(T item) {
            items.addLast(item);
        }

        T pop() {
            return items.removeLast();
        }
    }

    public static void main(String[] args) {
        Stack<String> jobs = new Stack<>();
        jobs.push("read");
        jobs.push("write");
        System.out.println(jobs.pop()); // write
    }
}
```

Python 的 `TypeVar` 把方法参数和返回值关联到同一个类型，`Generic[T]` 让类型检查器理解 `Stack[str]`。注解本身不在运行时拦截错误类型。`self._items` 在每次构造时新建，每个实例有独立的栈。Java 的 `<T>` 由调用者具体化，编译器据此检查入栈类型和出栈结果。`final` 固定的是对容器的引用，仍然可以修改内容。两边弹空栈分别抛 `IndexError` 和 `NoSuchElementException`，示例约定元素非空。入栈、出栈都是摊还 O(1)。[Python 类型提示文档](https://docs.python.org/3/library/typing.html)

## 自动装箱、拆箱与 null

```java
Map<String, Integer> count = new HashMap<>();
count.put("a", 1);
int a = count.getOrDefault("a", 0);
Integer missing = count.get("absent");
```

`put` 里的 `int` 自动装箱为 `Integer`；赋给 `int` 时再拆箱。如果直接 `int n=count.get("absent")`，拆箱相当于对 `null` 调用 `intValue`，会触发 `NullPointerException`。`==` 两边都是包装类型引用时比较身份，小整数缓存使一些例子碰巧正确，但不能依赖；若一边是基本数值类型，另一边会拆箱再比较数值，此时 `null` 仍会报错。比较包装对象的内容用 `equals`；可能为 `null` 时用 `Objects.equals`。

`ArrayList<Integer>` 的 `remove` 有重载：`remove(1)` 删除下标1，`remove(Integer.valueOf(1))` 删除第一个值1。回溯的 `path.remove(path.size()-1)` 明确撤销末尾元素。

## 引用传值、别名与快照

<a id="tpl-path-copy"></a>

**回溯结果：保存当前路径的快照**

让当前路径先变成 [7]，存下答案，然后撤销这一步。已经提交的答案应该保留 7。

```python
path = [7]
answers = [path.copy()]
path.pop()
print(answers)  # [[7]]
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> path = new ArrayList<>();
        List<List<Integer>> answers = new ArrayList<>();
        path.add(7);
        answers.add(new ArrayList<>(path));
        path.remove(path.size() - 1);
        System.out.println(answers); // [[7]]
    }
}
```

两边的复制都只新建外层路径。当前元素是整数，保存后可放心从原路径弹出。如果路径中装的是稍后会修改的列表，两份路径仍指向同一个内层列表，需要在修改发生的层级另行复制。复制一次长度为 k 的路径要 O(k)。

Java始终按值传参。对象参数复制的是引用值，所以多层函数可以持有指向同一可变对象的引用。直接把path加入answer后回溯，答案里的列表也跟着变化。`new ArrayList<>(path)` 复制列表结构，`Integer` 不可变，因此对整数路径足够；可变对象元素仍是浅拷贝，必要时需深拷贝。

`Arrays.asList(array)` 是受原数组支持的固定大小列表，可 `set`，不可 `add/remove`；修改列表元素会反映到原数组，反之亦然。`Collections.singletonList` 是不可增删、不可替换元素的单元素列表，但允许该元素为 `null`。Java 9 的 `List.of` 结果不可增删改且禁止 `null`；这几种列表均不等同于 `ArrayList`，也都不会自动深拷贝内部可变对象。`Arrays.asList(new int[]{1,2})` 产生一个 `int[]` 元素，不是两个 `Integer`。[Oracle 集合工具文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html#singletonList(T))。

## ArrayDeque：队列与栈的方向

| 用途 | 加入 | 删除并返回 | 只查看 |
|---|---|---|---|
| FIFO队列 | offer / offerLast | poll / pollFirst | peek / peekFirst |
| LIFO栈 | push / addFirst | pop / removeFirst | peek / peekFirst |

poll/peek为空返回null；pop/removeFirst/element为空抛异常。ArrayDeque禁止null，空树根必须先判断。队列从两端操作，栈从同一端操作，混用会改变遍历顺序。

层序遍历先保存 `int size=queue.size()`，只取出size个旧节点；不要在循环条件里重新读取不断变化的queue.size。图BFS通常在入队时就标记visited，防止多条边重复加入同一个节点。[Oracle ArrayDeque 文档](https://docs.oracle.com/javase/8/docs/api/java/util/ArrayDeque.html)。

<a id="tpl-deque-ends"></a>

**用队列和栈比较同一串输入**

把 4、7 依次放入两个容器。一个容器先服务先到的人，另一个先撤销最近的操作。区别只在取出的那一端。

```python
from collections import deque

queue = deque([4, 7])
stack = [4, 7]
print(queue.popleft())  # 4
print(stack.pop())      # 7
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> queue = new ArrayDeque<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int value : new int[] {4, 7}) {
            queue.addLast(value);
            stack.addLast(value);
        }
        System.out.println(queue.removeFirst()); // 4
        System.out.println(stack.removeLast());  // 7
    }
}
```

Python 列表在尾端 `append/pop` 适合做栈；用 `list.pop(0)` 做队列会搬动其余元素。双端队列能在首尾高效增删。Java 的 `removeFirst/Last` 在空队列时报错，若要在没有元素时返回 `null`，选择 `pollFirst/Last`。[Python deque 文档](https://docs.python.org/3/library/collections.html#collections.deque)

## HashMap 与 HashSet 的常用 API

<a id="tpl-group-indices"></a>

**按键分组并识别第一次出现**

依次读取 cat、dog、cat。每读一个词，就把下标追加到它的分组，同时记录所有键第一次出现的顺序。

```python
from collections import defaultdict

positions = defaultdict(list)
seen = set()
order = []
for i, word in enumerate(["cat", "dog", "cat"]):
    if word not in seen:
        seen.add(word)
        order.append(word)
    positions[word].append(i)
print(",".join(order))
print(positions["cat"])
```

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<String, List<Integer>> positions = new HashMap<>();
        Set<String> seen = new HashSet<>();
        List<String> order = new ArrayList<>();
        String[] words = {"cat", "dog", "cat"};
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            if (seen.add(word)) order.add(word);
            positions.computeIfAbsent(word, key -> new ArrayList<>()).add(i);
        }
        System.out.println(String.join(",", order));
        System.out.println(positions.get("cat"));
    }
}
```

两段都输出 `cat,dog` 和 `[0, 2]`。Python 的 `defaultdict(list)` 保存工厂函数，每个缺失键各建一个列表；`set.add` 返回 `None`，需要先判断成员。Java 的 `Set.add` 能直接判断是否首次插入。若只需计数，可写 `count[word] = count.get(word, 0) + 1` 或 `count.merge(word, 1, Integer::sum)`。

getOrDefault不写入缺失键。merge在缺失或当前值为null时直接放入新值，否则调用合并函数；合并结果为null会删除键。Integer::sum是方法引用，相当于(a,b)->Integer.sum(a,b)。

computeIfAbsent只在键缺失或值为null时调用映射函数并保存非null结果，再返回最终值，所以后面的add修改Map中那份列表。Lambda参数key满足Function签名，即使函数体没有用它也需要声明。避免在映射回调里结构性修改同一个Map。

putIfAbsent不覆盖已有非null值。containsKey判断键是否存在，get()==null无法区分没有键和映射到null。keySet、values、entrySet是关联原Map的视图，不是独立快照。Set.add返回是否实际插入，因此 `if(seen.add(x))` 可以同时去重和判断首次遇到。

哈希操作O(1)一般指期望/平均复杂度，不是所有输入下的无条件保证。HashMap允许一个null键，ConcurrentHashMap禁止null键值；不能把两种实现的契约混在一起。

## equals、hashCode 与可变键

逻辑相等对象必须有相同hashCode；反过来不成立。只覆盖equals不覆盖hashCode会破坏哈希容器的查找契约。

<a id="tpl-coordinate-key"></a>

**坐标作为哈希键**

先将 (2,3) 放入集合，再用一个新建的 (2,3) 查询。网格搜索需要两个对象只要坐标相同，就能识别为同一个状态。

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Point:
    x: int
    y: int


visited = {Point(2, 3)}
print(1 if Point(2, 3) in visited else 0)  # 1
```

```java
import java.util.*;
final class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Point)) return false;
        Point p = (Point) other;
        return x == p.x && y == p.y;
    }
    @Override public int hashCode() {
        return Objects.hash(x, y);
    }
}

public class Main {
    public static void main(String[] args) {
        Set<Point> visited = new HashSet<>();
        visited.add(new Point(2, 3));
        System.out.println(visited.contains(new Point(2, 3)) ? 1 : 0);
    }
}
```

Python 的 `@dataclass(frozen=True)` 为本例这类不可变整数字段生成按字段比较的相等和哈希方法；想少定义一个类，也可直接用 `(row, col)` 元组。Java 示例显式写出同样的相等关系，Java 16 起用 `record Point(int x, int y) {}` 也可以。两者都打印 1。

@Override让编译器检查确实重写了父类方法，防止参数不同而无意变成重载。instanceof检查通过后才能安全强转，null instanceof任何类型均为false。final类不可继承，final字段不能重赋值。

哈希键参与equals/hashCode的字段不能在入表后随意修改，否则对象所在桶和当前哈希值可能不一致。数组默认按身份比较；两个内容相同的int[]不equals，需要Arrays.equals或不可变键类。

## Comparator、lambda 与安全比较

<a id="tpl-priority-tie"></a>

**优先队列：相同优先级按到达顺序取出**

数字越小越紧急。先加入优先级 2 的 write，再加入两个优先级 1 的任务 read 和 save。要保证 read 先于 save，就必须把到达顺序也写进比较规则。

```python
from heapq import heappop, heappush

queue = []
tasks = [(2, "write"), (1, "read"), (1, "save")]
for seq, (priority, name) in enumerate(tasks):
    heappush(queue, (priority, seq, name))
while queue:
    priority, seq, name = heappop(queue)
    print(name)
```

```java
import java.util.Comparator;
import java.util.PriorityQueue;

public class Main {
    record Task(int priority, int seq, String name) {}

    public static void main(String[] args) {
        var queue = new PriorityQueue<>(Comparator.comparingInt(Task::priority)
                                                  .thenComparingInt(Task::seq));
        queue.add(new Task(2, 0, "write"));
        queue.add(new Task(1, 1, "read"));
        queue.add(new Task(1, 2, "save"));
        while (!queue.isEmpty()) {
            System.out.println(queue.remove().name());
        }
    }
}
```

两边依次输出 read、save、write。Python 元组按字段从左到右比较；序号唯一，比较到序号就能分出先后，即使实际载荷不支持比较也可使用。Java 的 `Task::priority` 是取整数字段的方法引用，`thenComparingInt` 仅在主键相等时比较序号。本段用了 Java 16 的 `record`。[Python heapq 文档](https://docs.python.org/3/library/heapq.html)

比较器返回负数表示 a 排在 b 前，零表示排序关系相等，正数表示 a 排在 b 后。若堆内放的是二元数组，可把比较器写成 `(a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1])`。这个 lambda 实现 Comparator 的 compare 方法；三元表达式只执行选中的分支，第一字段相同时才比较第二字段。只处理整数时，`new PriorityQueue<Integer>()` 默认小根堆，`new PriorityQueue<Integer>(Comparator.reverseOrder())` 改为大根堆。

不能直接 `a[0]-b[0]`，大整数相减可能溢出，使顺序反转。long用Long.compare。也可用 `Comparator.comparingInt((Task t)->t.priority).thenComparing(t->t.name)`；显式参数类型有时帮助泛型推断。

PriorityQueue只保证peek/poll取最优先值，for-each并不排序。offer/poll O(log n)，peek O(1)，remove(Object)/contains O(n)。修改堆中对象的比较字段不会自动恢复堆，需要移除重插、懒删除或支持更新的专用结构。[Oracle PriorityQueue 文档](https://docs.oracle.com/javase/8/docs/api/java/util/PriorityQueue.html)。

## TreeMap、TreeSet 与排序相等

树容器按Comparator或自然顺序定位。compare返回0会被TreeSet当作同一个元素，即使equals不同。存储同分学生时应把学号加入比较器，否则会丢记录。

first/last找最小/最大；lower严格小于，floor小于等于，ceiling大于等于，higher严格大于。TreeMap有对应Key/Entry方法。不存在的邻居一般返回null；空TreeSet的first/last抛异常。基础插入、删除、查询O(log n)。

String自然顺序按UTF-16代码单元比较，不是中文拼音。英文小写题目可直接采用；语言相关的人类排序要另定规则。

<a id="tpl-ordered-neighbors"></a>

**在有序键中找前驱和后继**

有序键为 [2,5,9]。在键 5 上做两个严格查询：最大的更小键是 2，最小的更大键是 9。

```python
from bisect import bisect_left, bisect_right

keys = [2, 5, 9]
target = 5
left = bisect_left(keys, target)
right = bisect_right(keys, target)
print(keys[left - 1] if left > 0 else None)
print(keys[right] if right < len(keys) else None)
```

```java
import java.util.List;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        var keys = new TreeSet<>(List.of(2, 5, 9));
        System.out.println(keys.lower(5));
        System.out.println(keys.higher(5));
    }
}
```

Python 的左边界落在第一个 ≥ 5 的位置，往前一步才是严格小于 5 的键；右边界直接落在第一个 > 5 的位置。检查边界可避免把下标 -1 读成最后一个元素。两种查询均为 O(log n)。Java 树集合支持 O(log n) 插入并去重；这里 Python 有序列表要自行保持有序和唯一，`insort` 插入的元素搬移可达 O(n)。边界上没有邻居时，上例 Python 返回 `None`，Java 返回 `null`。[Python bisect 文档](https://docs.python.org/3/library/bisect.html)

## 数组排序、二分与半开区间

Arrays.sort(int[])原地排序；基本类型数组不能直接传Comparator，要改用Integer[]或带索引的对象数组。Arrays.sort(Object[], comparator)才使用对象比较器。

Arrays.binarySearch命中时不保证返回重复值的最左或最右下标；未命中返回 `-(insertionPoint)-1`。不能把负值直接当下标；需要严格lower_bound/upper_bound时应写清区间不变量。

copyOfRange(a,from,to)的右端不含to，substring(from,to)也一样。Arrays.fill填一维数组，二维数组需逐行fill。`left+(right-left)/2` 可避免left+right溢出；如果差值也可能超过int，就使用long。

<a id="tpl-lower-bound"></a>

**二分查找第一个大于等于目标的位置**

在 [1,3,3,7] 中找第一个 3。保留区间 [lo,hi)，区间左边的元素都小于目标，从 hi 往右的元素都大于等于目标。

```python
def lower_bound(values, target):
    lo, hi = 0, len(values)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo


print(lower_bound([1, 3, 3, 7], 3))  # 1
```

```java
public class Main {
    static int lowerBound(int[] values, int target) {
        int lo = 0, hi = values.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (values[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        System.out.println(lowerBound(new int[] {1, 3, 3, 7}, 3));
    }
}
```

第一次 mid=2，值等于 3，仍可能有更早的 3，所以 hi=2。接着 mid=1 也命中，令 hi=1。最后 mid=0 的值小于 3，令 lo=1，两端相遇返回 1。结果可能等于数组长度，访问前要检查范围。每轮至少排除约一半候选，时间 O(log n)，额外空间 O(1)。

## 字符串、字符与 StringBuilder

String不可变，循环反复s+=part可能累计O(n²)拷贝。StringBuilder通过可增长缓冲区追加，append通常摊还高效，toString产生字符串结果。StringBuilder不是线程安全类，跨线程共享需同步或改设计。

char是16位UTF-16代码单元，不保证代表一个完整Unicode字符；部分emoji占两个char。charAt/length按代码单元工作。a..z映射 `ch-'a'` 依赖题目字符范围；处理完整Unicode需考虑codePoints及int码点。

String.split接受正则：按点分隔写 `"\\."`，按竖线分隔写 `"\\|"`。Java字符串转义一次后，还要让正则看到转义字符。默认去掉尾部空字段，保留它们用split(",",-1)。substring当前Java实现会复制所需内容，不能在复杂度分析中一律当O(1)。

<a id="tpl-string-buffer"></a>

**可增长字符缓冲区**

把 r、e、d 依次装入缓冲区，得到 red。扫描、解码或回溯需要先攒字符时，可以把构造过程和最终分配字符串的时机分开。

```python
parts = []
for ch in "red":
    parts.append(ch)
print("".join(parts))
```

```java
public class Main {
    public static void main(String[] args) {
        StringBuilder buffer = new StringBuilder();
        for (char ch : "red".toCharArray()) {
            buffer.append(ch);
        }
        System.out.println(buffer.toString());
    }
}
```

Python 的 `"".join(parts)` 用空字符串作分隔符，要求元素已经是字符串；Java 的 `append` 修改缓冲区，`toString()` 生成当时内容的字符串。输出 n 个字符的总构造时间为 O(n)。这里的输入是 ASCII 字符。

## 位运算、补码与移位

| 表达式 | 含义 | 细节 |
|---|---|---|
| x & y | 对应位都为1才为1 | 与短路逻辑&&不同 |
| x \| y | 至少一位为1 | 与短路逻辑或不同 |
| x ^ y | 对应位不同为1 | x^x=0 |
| ~x | 所有位取反 | int固定32位 |
| x << k | 左移 | 丢弃高位，不检测溢出 |
| x >> k | 算术右移 | 高位补符号位 |
| x >>> k | 逻辑右移 | 高位补0 |
| x & (x-1) | 清除最低的1 | 适合遍历集合位 |
| x & -x | 提取最低的1 | 利用补码 |

判断第k位写 `(mask & (1 << k)) != 0`，括号避免运算符优先级误读。long掩码用 `1L << k`，否则先按32位int执行再转换就太晚了。int移位距离仅保留低5位，long仅低6位，所以1<<32等于1<<0，不会得到一个第32位的int。

Integer.bitCount返回32位模式里的1数量，负数也按补码计算，不是绝对值的二进制位数。0xff只是十六进制字面量写法，不改变变量自身类型。

<a id="tpl-set-bits"></a>

**位掩码：逐个弹出已选元素**

位掩码 0b10110 表示已经选择了编号 1、2、4。每次定位一个最低的 1，然后只清掉这个位置。

```python
mask = 0b10110
while mask:
    bit = mask & -mask
    print(bit.bit_length() - 1)
    mask &= mask - 1
```

```java
public class Main {
    public static void main(String[] args) {
        int mask = 0b10110;
        while (mask != 0) {
            int position = Integer.numberOfTrailingZeros(mask);
            System.out.println(position);
            mask &= mask - 1;
        }
    }
}
```

两边依次打印 1、2、4。第一次 `mask-1` 得到 10101，与原值做按位与只留下 10100。Python 的 `bit_length()` 是正整数二进制表示的位数，减 1 得到位编号；Java 直接数出尾随 0 的个数。模板约定非负掩码：Python 的负整数做按位操作时会符号扩展，不能用这个循环遍历任意负数。

## 溢出、类型提升与不可达状态

```java
long product = (long) a * b;
long exponent = n;
if (exponent < 0) exponent = -exponent;
int inf = 1_000_000_000;
```

必须在乘法前转long；long product=a*b仍先做int乘法。int的最小值取负无法放进int，所以Pow等题先把指数转long再取负。数字下划线只改善可读性，1_000和1000相同。

Java整数溢出默认按补码截断，不抛异常；Math.addExact/multiplyExact可以检查。double有精度限制，不能无条件替代整数计数。超long的精确整数用BigInteger，它不可变，add返回新对象而不修改原值。

不要把Integer.MAX_VALUE当不可达值后直接加1。可以先检查可达，或挑一个超过合法答案而且相加不溢出的INF。先溢出再取模不能恢复正确答案，乘法前就要提升类型。

## static、final、嵌套类与动态分派

static成员属于类；非static字段属于某个对象。静态方法不能不经对象就访问实例字段。LeetCode的Solution方法通常由平台构造实例后调用，不需要随意加static。

final引用只能限制重绑定，final List仍可add。静态嵌套Node类不隐式持有外部实例，适合堆元素、Trie节点、DP状态。非静态内部类会关联外部对象。

重载overload按参数签名选择，不能只靠返回类型区分；重写override由运行时对象类型动态分派。构造器没有返回类型，名称必须与类名相同。this是当前实例，super用于父类构造器或父类实现。

## Lambda 捕获、方法引用与 Stream

Lambda捕获的局部变量必须final或effectively final，即初始化后不再重赋值。引用指向的容器内容仍可修改，这不代表线程安全。不要随意用长度1数组隐藏可变计数器来规避该规则。

String::length是未绑定实例方法引用，接收字符串再调用length；obj::method绑定确定对象；Type::new引用构造器。目标函数式接口决定参数和返回类型，@FunctionalInterface检查只有一个抽象方法。

`Stream` 的 `map/filter` 等中间操作是惰性的，`collect/count` 等终止操作才请求计算结果；这不代表所有中间 Lambda 都必定执行。例如源的元素数已知，且流水线未改变元素数时，`count()` 可以直接取得大小而省略 `map/peek`，不能依赖其中的日志或修改副作用。一个 Stream 不能重复消费；`parallelStream` 也不保证更快。带共享可变状态的 Lambda 会引入竞态，优先使用明确的归约操作。[Oracle Stream 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)。

## 异常与资源生命周期

IOException等受检异常必须捕获或声明throws；RuntimeException及其子类不强制声明。throw抛一个异常对象，throws是方法可能向上传播的异常声明。

```java
try (java.io.BufferedReader reader = java.nio.file.Files.newBufferedReader(path)) {
    String line = reader.readLine();
}
```

此片段假设path是Path且外围方法处理或声明IOException。try-with-resources会按声明逆序关闭AutoCloseable资源，发生异常也关闭；关闭失败可能成为suppressed异常，保留主异常。finally本身不是事务回滚，文件、数据库和共享内存的修改各有恢复机制。

## synchronized、volatile 与原子性

synchronized提供互斥和可见性，所有维护同一不变量的操作应使用同一把锁。实例同步方法锁this，静态同步方法锁Class对象，锁不同对象不会互相排斥。

volatile提供规定的可见性与有序性，不使count++的读改写整体原子。单计数可用AtomicInteger，多个字段的联合约束可能仍需锁。双重检查单例引用需volatile避免不安全发布；这并不自动使该对象所有方法线程安全。

wait必须持有对应监视器，等待时释放它，返回前重新竞争锁。条件需放while检查，不能假定唤醒代表条件已经成立。sleep不释放已经持有的监视器；notifyAll唤醒等待者去竞争，不会立刻让某个等待者获得执行权。

## Python 对照：阅读课件的另一份实现

Optional[T]/List[T]是类型提示，不自动强制运行时类型。None对应空引用概念；self显式表示实例，Java用隐式this。Python int为任意精度，移植到Java要重新分析位宽和溢出。

a[:]、list(a)都是浅拷贝；`[[0]*m]*n` 共享同一个内层列表，二维独立行应写 `[[0]*m for _ in range(n)]`。heapq默认小根堆，元组按字段字典序比较，对应Java显式Comparator。deque.popleft高效取队首，list.pop(0)则移动元素。

yield构造可暂停恢复的生成器，Java示例多改为显式List或Iterator。nonlocal重新绑定外层函数局部变量；global重新绑定模块变量。只向同一外层列表append并不重新绑定变量，不需要nonlocal。
