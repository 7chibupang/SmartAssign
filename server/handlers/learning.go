package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// 获取学习心得
func GetLearningNote(c *gin.Context) {
	// 尝试从不同路径读取学习心得文件
	paths := []string{
		"../学习心得.md",
		"./学习心得.md",
		"../../学习心得.md",
	}

	var content string

	for _, path := range paths {
		absPath, _ := filepath.Abs(path)
		data, readErr := os.ReadFile(absPath)
		if readErr == nil {
			content = string(data)
			break
		}
	}

	if content == "" {
		// 如果没有找到文件，返回默认内容
		content = `# 学习心得

## 项目开发感悟

在开发这个题库管理系统的过程中，我学习到了前后端分离的开发模式，掌握了Go语言Gin框架和React前端开发技术。

## 技术收获

1. **Go语言**：学会了使用Gin框架构建RESTful API
2. **React**：掌握了Ant Design组件库的使用
3. **SQLite**：理解了轻量级数据库的应用场景

## 遇到的问题

1. 跨域问题的解决
2. 前后端数据格式的协调
3. 大模型API的调用和解析`
	}

	c.JSON(http.StatusOK, gin.H{
		"content": content,
	})
}
