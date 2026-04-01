基础信息
基础URL：http://localhost:8080/api
数据格式：JSON

核心接口
题目管理接口

获取题目列表
GET /questions
参数：page, pageSize, type, difficulty, keyword
响应：题目数组和分页信息

创建题目
POST /questions
请求体：题目对象（type, title, options, answer等）
响应：创建成功的题目

批量导入题目
POST /questions/batch
请求体：{ "questions": [题目数组] }
响应：导入结果统计

更新题目
PUT /questions/{id}
请求体：更新后的题目对象

删除题目
DELETE /questions/{id}
AI出题接口

生成题目
POST /ai/generate
请求体：{ type, num, difficulty, language }
响应：生成的题目数组

学习笔记接口
获取学习笔记
GET /learning-note
响应：Markdown格式内容