package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"qwen-homework/database"
	"qwen-homework/handlers"
	"qwen-homework/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	err := database.InitDB()
	if err != nil {
		log.Fatal("数据库初始化失败: ", err)
	}
	defer database.DB.Close()

	// 初始化AI服务（使用新的SDK）
	if err := handlers.InitAIService(); err != nil {
		log.Printf("⚠️  警告: AI服务初始化失败，'AI出题'功能将不可用。错误: %v", err)
		log.Printf("⚠️  请检查 'services/ai_service.go' 文件中的API密钥是否正确，以及网络连接。")
	} else {
		log.Println("✅ AI服务（阿里云百炼）初始化成功")
	}

	// 创建Gin实例
	r := gin.Default()

	// 配置跨域中间件
	r.Use(middleware.CORS())

	// 配置静态文件服务
	// 关键修改：指向正确的构建目录
	distPath := "../client/dist"

	// 检查是否存在构建的前端文件
	if _, err := os.Stat(distPath); err == nil {
		// 提供静态文件
		r.Static("/assets", filepath.Join(distPath, "assets"))
		r.StaticFile("/", filepath.Join(distPath, "index.html"))
		r.StaticFile("/index.html", filepath.Join(distPath, "index.html"))

		// 处理前端路由：对于所有非API请求，返回index.html
		r.NoRoute(func(c *gin.Context) {
			if c.Request.URL.Path != "/" && filepath.Ext(c.Request.URL.Path) == "" {
				c.File(filepath.Join(distPath, "index.html"))
			}
		})

		log.Println("✅ 静态文件服务已启用，从 ", distPath, " 目录提供")
	} else {
		log.Println("⚠️  未找到前端构建资源，仅提供API服务")
		log.Println("⚠️  请先构建前端: cd client && npm run build")
	}

	// API路由组
	api := r.Group("/api")
	{
		// 题目管理相关路由
		api.GET("/questions", handlers.GetQuestions)
		api.POST("/questions", handlers.CreateQuestion)             // 创建单个题目
		api.POST("/questions/batch", handlers.BatchImportQuestions) // 批量导入题目
		api.PUT("/questions/:id", handlers.UpdateQuestion)
		api.DELETE("/questions/:id", handlers.DeleteQuestion)
		api.POST("/questions/batch-delete", handlers.BatchDeleteQuestions)

		// AI相关路由
		api.POST("/ai/generate", handlers.GenerateQuestions) // AI出题接口

		// 学习心得相关路由
		api.GET("/learning-note", handlers.GetLearningNote)
	}

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("🚀 服务器启动成功，监听于 :%s", port)
	log.Printf("📚 API端点列表：")
	log.Printf("   GET    http://localhost:%s/api/questions", port)
	log.Printf("   POST   http://localhost:%s/api/questions", port)
	log.Printf("   POST   http://localhost:%s/api/questions/batch", port)
	log.Printf("   POST   http://localhost:%s/api/ai/generate", port)
	log.Printf("🌐 前端访问：http://localhost:%s/", port)

	log.Fatal(http.ListenAndServe(":"+port, r))
}
