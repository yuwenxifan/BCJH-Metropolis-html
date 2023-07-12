# BCJH-Metropolis-html
### 访问地址
https://run.bcjh.xyz/
https://yuwenxifan.github.io/BCJH-Metropolis-html/

### 介绍
原项目：https://github.com/hjenryin/BCJH-Metropolis

宴会跑分计算器的网页移植版，通过 emscripten 实现，将c++项目编译成js（在此鸣谢原项目作者ajdx，核心算法全是他做的，我就弄了交互页面和规则接口）


### 使用
1. 打开网页，填入白菜菊花的个人数据id（仅首次使用，或个人数据有更新时才需要填写）；
2. 选择宴会规则，填入期望达到的分数，点击开始按钮开始运行；
3. 耐心等待结果输出即可，会根据机器CPU核数开启多个线程计算，实时输出最佳结果；
5. 分数列表中红色的表示没达到期望分数，绿色的表示达到了，结果出来后还可以修改分数线让结果变色。分数可以点击，用来查看不同结果；
6. 每个线程内的逻辑都是找到期望分数就停，所以分数线设得低计算就会很快，输出结果全是绿的情况就表示分数还有很大提升空间，可以把期望分数填高一些再算；
7. 期望分数和迭代次数不建议同时设得很高，可能会需要跑很久。
