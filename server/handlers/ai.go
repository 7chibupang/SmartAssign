package handlers

import (
	"encoding/json"
	"net/http"
	"qwen-homework/models"
	"qwen-homework/services"

	"github.com/gin-gonic/gin"
)

var aiService *services.AIService

func InitAIService() error {
	var err error
	aiService, err = services.NewAIService()
	return err
}

func GenerateQuestions(c *gin.Context) {
	var req models.QuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数不合法"})
		return
	}

	if aiService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI服务未初始化"})
		return
	}

	// 1. 构建精准提示词
	prompt := services.BuildQwenPrompt(string(req.Type), string(req.Difficulty), req.Num, req.Language)

	// 2. 调用AI服务
	rawQuestions, err := aiService.GenerateQuestions(c.Request.Context(), prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成题目失败: " + err.Error()})
		return
	}

	// 3. 转换为你的数据库模型
	var questions []models.Question
	for _, rq := range rawQuestions {
		q := models.Question{
			Type:       req.Type,
			Difficulty: req.Difficulty,
			Title:      getString(rq, "title"),
		}

		// 处理语言字段（编程题需要）
		if req.Type == models.Programming {
			lang := getString(rq, "language")
			if lang == "" && req.Language != nil {
				lang = *req.Language
			}
			q.Language = &lang
		} else {
			q.Language = req.Language
		}

		// 处理选择题的选项和答案
		if req.Type != models.Programming {
			if opts, ok := rq["options"].([]interface{}); ok {
				optionsJSON, _ := json.Marshal(opts)
				q.Options = optionsJSON
			}
			if ans, ok := rq["answer"]; ok && ans != nil {
				answerJSON, _ := json.Marshal(ans)
				q.Answer = answerJSON
			}
		}

		questions = append(questions, q)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "生成成功",
		"data":    questions,
		"count":   len(questions),
	})
}

// 辅助函数：从map中提取字符串
func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok && v != nil {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
