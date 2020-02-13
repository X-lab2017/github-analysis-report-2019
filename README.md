# GitHub 2019 数据年报

## 简介

在开源日益重要的今天，我们需要一份建立在全域大数据基础上的相对完整、可以反复进行推演的数据报告（报告、数据、算法均需开源）。本项目为X-lab 开放实验室团队发起，旨在通过分析Github全网的开发者行为日志，通过数据的视角，来观察全球范围内的开源现状、进展趋势、演化特征、以及未来挑战等问题，除了展现目前开源世界全貌之外，我们特别关注中国的开发者和企业组织在整个开源产业中的表现。本报告中使用 2019 年全年 GitHub 日志进行统计，总日志条数约 5.46 亿条。

**关键词**：开源、行为数据、开发者行为、Github、数字报告

## 数据年报

关于数据年报，请点击[《GitHub 2019 数字年报全文》](./REPORT.md)。

本报告使用 2019 年全年 GitHub 日志进行统计，总日志条数约 5.46 亿条，相较 2018 年的 4.21 亿条增长约 29.7%。在上述开发者活跃度与项目活跃度的定义下，统计得到 2019 年总活跃项目数量约 512W 个，相较 2018 年的约 313W 增长约 63.6%，2019 年总活跃开发者数量约 360W，相较 2018 年的约 303W 增长约 18.8%。

**世界 Top 10 开发者账号**

![global_top_10_dev_act](./static/global_top_10_dev_act.png)

**世界 Top 10 项目**

![global_top_10_dev_act](./static/global_top_10_repo_act.png)

**中国 Top 20 项目分析**

![chinese_top_20_act](./static/chinese_top_20_act.png)

## 原始数据

关于数据，请访问[CDN](http://cdn.opensource-service.cn/github-analysis-report-2019/data.json.gz)

由于原始的日志文本数据数据量较大（约 1.45TB），故随本文开放的数据为统计处理并压缩后的数据文件，总大小约为 225MB，解压后文件内容为文本内容，总大小约 1.3GB，总行数约 2169 万行。每行为一个记录项，由 Json格式编码，该文件不再区分具体日期，直接给出每个账号在每个项目中的2019全年的操作次数，以方便处理。内容说明如下：

| 字段 | 类型   | 说明     |
| ---- | ------ | -------- |
| r    | string | 项目名称 |
| u    | string | 账号名称 |
| t    | number | 操作类型 |
| c    | number | 操作次数 |



## 分析程序

分析程序使用命令：

```shell
$npm i
$npm start -- --help
$npm start
```

在使用 `npm start -- --help` 后可以看到相关的帮助信息，内容如下：

```shell
Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  -f         Origin data file path     [string] [default: "./data/data.json.gz"]
  -c         Issue comment weight                          [number] [default: 1]
  -i         Open issue weight                             [number] [default: 2]
  -p         Open PR weight                                [number] [default: 3]
  -r         Review comment weight                         [number] [default: 4]
  -m         PR merged weight                              [number] [default: 5]
  -n         Output repo count                            [number] [default: 10]
  --detail   Whether show detail data                 [boolean] [default: false]
  --detailn  Number to print for detail data              [number] [default: 10]
  --mode     Output mode   [choices: "repo", "dev", "company"] [default: "repo"]
  --search   Search items to output                        [array] [default: []]
  --compTop  Show top N count for company         [array] [default: [500,10000]]
  --sort     Order by activity or repo/developer count
                                        [choices: "act", "cnt"] [default: "act"]
  --ch       Only show chinese repos                  [boolean] [default: false]
```

其中 `-f` 为数据文件所在路径，默认路径为 `./data/data.json.gz`，故下载数据文件后放在该路径下，则不需要指定 `-f` 参数，否则可以自行指定文件所在路径。

在计算模型中，Comment、Open Issue、Open PR、Review Comment、Merge PR 对应的权重默认为 1、2、3、4、5，可以通过启动选项 `-c, -i, -p, -r, -m` 来分别修改对应权重，以获取定制权重的排行结果。

`--mode` 为主要的设置参数之一，表示分析类型，可以为 `repo, dev, company` 之一，默认为 `repo`。当为 `repo` 时分析结果以仓库为主体，当为 `dev` 时结果以开发者为主体，当为 `company` 时结果以公司为主体。其中 `company` 与仓库之间的关联通过 [`chinese_company`](./chinese_company) 文件定义，文件中每一个空行隔开的一个部分为一个完整的公司，块内第一行为公司名，其后为跟随的项目或组织的名称，大小写敏感。`-n` 参数决定最终输出结果时输出 Top n。

`--detail` 表示输出时为详情模式，在不同的 `--mode` 下，详情模式输出的内容也不相同。在 `repo` 模式下，详情模式会在输出 Top `-n` 的同时，输出每个项目中 Top `--detailN` 个开发者的统计信息。在 `dev` 模式下，详情模式会在输出 Top `-n` 的同时，输出每个开发者参与的项目中活跃度 Top `--detailN` 的项目及对应的统计信息。 在 `company` 模式下，详情模式会在输出 Top `-n` 的同时，输出每个企业中 Top `--detailN` 个项目的详情。

在 `--mode` 为 `company` 时，可以通过设置 `--compTop` 来输出该企业的所有项目在世界 Top N 中的项目数量，默认会输出 Top 500 和 Top 10000 中的项目数量。

在指定 `--search` 时，可以搜索对应模式下的项目或开发者账号的信息，支持同时搜索多个，并使用正则匹配。

通过修改 `--sort` 选项为 `cnt`，可以修改排名方式，默认 `act` 排名模式下，项目与开发者以活跃度排名，`cnt` 排名模式下，项目与开发者分别以参与项目人数和参与项目个数排名。

若仅关注中国项目情况，可以通过打开 `--ch` 选项，中国项目的筛选通过指定 org 或 repo 名称的方式，内容为 [`chinese`](./chinese) 文件和 [`chinese_company`](./chinese_company) 文件中的项目并集，目前为人工标注方式。
