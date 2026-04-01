package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"qwen-homework/database"
	"qwen-homework/models"

	"github.com/gin-gonic/gin"
)

// 获取题目列表
func GetQuestions(c *gin.Context) {
	var req models.PaginationRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 10
	}

	// 构建查询条件
	query := "SELECT id, type, difficulty, language, title, options, answer, created_at FROM questions WHERE 1=1"
	params := []interface{}{}

	if req.Type != "" {
		query += " AND type = ?"
		params = append(params, req.Type)
	}

	if req.Keyword != "" {
		query += " AND title LIKE ?"
		params = append(params, "%"+req.Keyword+"%")
	}

	// 获取总数
	countQuery := strings.Replace(query, "SELECT id, type, difficulty, language, title, options, answer, created_at", "SELECT COUNT(*)", 1)
	var total int64
	err := database.DB.QueryRow(countQuery, params...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}

	// 添加分页
	query += " ORDER BY created_at ASC LIMIT ? OFFSET ?"
	offset := (req.Page - 1) * req.PageSize
	params = append(params, req.PageSize, offset)

	rows, err := database.DB.Query(query, params...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		var optionsStr, answerStr sql.NullString
		var language sql.NullString

		err := rows.Scan(&q.ID, &q.Type, &q.Difficulty, &language, &q.Title, &optionsStr, &answerStr, &q.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "数据解析失败"})
			return
		}

		if language.Valid {
			q.Language = &language.String
		}

		if optionsStr.Valid && optionsStr.String != "" {
			q.Options = json.RawMessage(optionsStr.String)
		}

		if answerStr.Valid && answerStr.String != "" {
			q.Answer = json.RawMessage(answerStr.String)
		}

		questions = append(questions, q)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  questions,
		"total": total,
		"page":  req.Page,
		"size":  req.PageSize,
	})
}

// 创建题目
func CreateQuestion(c *gin.Context) {
	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误: " + err.Error()})
		return
	}

	// 验证必填字段
	if question.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "题目内容不能为空"})
		return
	}

	// 对于单选题和多选题，必须要有选项
	if (question.Type == models.SingleChoice || question.Type == models.MultipleChoice) && len(question.Options) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "选择题必须包含选项"})
		return
	}

	// 插入数据库
	var optionsStr, answerStr interface{}
	if len(question.Options) > 0 {
		optionsStr = string(question.Options)
	} else {
		optionsStr = nil
	}

	if len(question.Answer) > 0 {
		answerStr = string(question.Answer)
	} else {
		answerStr = nil
	}

	result, err := database.DB.Exec(
		"INSERT INTO questions (type, difficulty, language, title, options, answer) VALUES (?, ?, ?, ?, ?, ?)",
		question.Type, question.Difficulty, question.Language, question.Title, optionsStr, answerStr,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败: " + err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	question.ID = id

	c.JSON(http.StatusOK, gin.H{
		"message": "创建成功",
		"data":    question,
	})
}

// 更新题目
func UpdateQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID格式错误"})
		return
	}

	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	question.ID = id

	// 检查题目是否存在
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM questions WHERE id = ?)", id).Scan(&exists)
	if err != nil || !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "题目不存在"})
		return
	}

	// 更新数据库
	var optionsStr, answerStr interface{}
	if len(question.Options) > 0 {
		optionsStr = string(question.Options)
	} else {
		optionsStr = nil
	}

	if len(question.Answer) > 0 {
		answerStr = string(question.Answer)
	} else {
		answerStr = nil
	}

	_, err = database.DB.Exec(
		"UPDATE questions SET type = ?, difficulty = ?, language = ?, title = ?, options = ?, answer = ? WHERE id = ?",
		question.Type, question.Difficulty, question.Language, question.Title, optionsStr, answerStr, id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "更新成功",
		"data":    question,
	})
}

// 删除单个题目
func DeleteQuestion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID格式错误"})
		return
	}

	_, err = database.DB.Exec("DELETE FROM questions WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// 批量删除题目
func BatchDeleteQuestions(c *gin.Context) {
	var request struct {
		IDs []int64 `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if len(request.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择要删除的题目"})
		return
	}

	// 构建IN查询
	placeholders := strings.Repeat("?,", len(request.IDs)-1) + "?"
	query := "DELETE FROM questions WHERE id IN (" + placeholders + ")"

	// 转换为interface{}切片
	params := make([]interface{}, len(request.IDs))
	for i, id := range request.IDs {
		params[i] = id
	}

	_, err := database.DB.Exec(query, params...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "批量删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "批量删除成功", "count": len(request.IDs)})
}

// BatchImportQuestions 批量导入题目
func BatchImportQuestions(c *gin.Context) {
	var request struct {
		Questions []models.Question `json:"questions" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	if len(request.Questions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "题目列表不能为空",
		})
		return
	}

	var successCount int
	var failedCount int
	var errors []string

	// 遍历所有题目并插入
	for _, question := range request.Questions {
		// 验证必填字段
		if question.Title == "" {
			failedCount++
			errors = append(errors, "题目标题不能为空")
			continue
		}

		// 设置默认值
		if question.Difficulty == "" {
			question.Difficulty = "medium"
		}
		if question.Type == "" {
			question.Type = "single_choice"
		}

		// 插入数据库
		var optionsStr, answerStr interface{}
		if len(question.Options) > 0 {
			optionsStr = string(question.Options)
		} else {
			optionsStr = nil
		}

		if len(question.Answer) > 0 {
			answerStr = string(question.Answer)
		} else {
			answerStr = nil
		}

		_, err := database.DB.Exec(
			"INSERT INTO questions (type, difficulty, language, title, options, answer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			question.Type, question.Difficulty, question.Language, question.Title, optionsStr, answerStr, time.Now(),
		)

		if err != nil {
			failedCount++
			errors = append(errors, fmt.Sprintf("题目 '%s' 导入失败: %v", question.Title, err))
		} else {
			successCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("成功导入 %d 道题目，失败 %d 道", successCount, failedCount),
		"data": gin.H{
			"successCount": successCount,
			"failedCount":  failedCount,
			"errors":       errors,
		},
	})
}
