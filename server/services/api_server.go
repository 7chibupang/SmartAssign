package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// AIService 使用官方的OpenAI兼容SDK
type AIService struct {
	client *openai.Client
	model  string
}

// NewAIService 创建AI服务实例（API Key直接硬编码在这里）
func NewAIService() (*AIService, error) {
	// !!! 重要：将 sk-xxx 替换为你从百炼控制台获取的真实API Key !!!
	apiKey := "sk-b9cb0be06a93493c98e5c4a5861abc91"                // 请替换
	baseURL := "https://dashscope.aliyuncs.com/compatible-mode/v1" // 北京地域
	model := "qwen-plus"                                           // 或 qwen-max，根据你的模型权限选择

	if apiKey == "" || strings.Contains(apiKey, "sk-xxx") {
		return nil, fmt.Errorf("请在 services/ai_service.go 中配置正确的百炼API Key")
	}

	// 按照官方示例创建客户端
	config := openai.DefaultConfig(apiKey)
	config.BaseURL = baseURL // 关键：设置为百炼的OpenAI兼容端点

	client := openai.NewClientWithConfig(config)

	return &AIService{
		client: client,
		model:  model,
	}, nil
}

// BuildQwenPrompt 构建强约束的提示词（解决“白板”问题的关键）
func BuildQwenPrompt(questionType, difficulty string, num int, language *string) string {
	var prompt strings.Builder

	// 1. 系统指令：严格约束AI角色和输出格式（非常重要！）
	prompt.WriteString(`你是一个专业的题目生成系统。你的任务是根据用户要求生成特定格式的题目。请严格遵守以下规则：
1. 你**必须**返回一个纯净的JSON数组，不要有任何额外的解释、问候语、Markdown代码块标记（如json）或任何其他文本。
2. 输出的JSON必须能被标准库直接解析。
3. 根据题型不同，严格包含指定的字段。`)

	// 2. 用户指令：明确具体的题目要求
	prompt.WriteString(fmt.Sprintf("\n\n请生成 %d 道 %s 难度的", num, difficulty))

	// 3. 根据题型细化JSON结构要求
	switch questionType {
	case "single_choice":
		prompt.WriteString(`单选题。
每道题目的JSON对象必须包含以下字段：
- "title": 字符串，题目内容。
- "options": 数组，包含4个字符串，分别对应选项A、B、C、D的内容（例如：["选项A内容", "选项B内容", "选项C内容", "选项D内容"]）。
- "answer": 字符串，单个正确选项字母（例如："A"）。`)
	case "multiple_choice":
		prompt.WriteString(`多选题。
每道题目的JSON对象必须包含以下字段：
- "title": 字符串，题目内容。
- "options": 数组，包含4个字符串，分别对应选项A、B、C、D的内容。
- "answer": 数组，包含一个或多个正确选项字母（例如：["A", "C"]）。`)
	case "programming":
		lang := "Go"
		if language != nil && *language != "" {
			lang = *language
		}
		prompt.WriteString(fmt.Sprintf(`%s编程题。
每道题目的JSON对象必须包含以下字段：
- "title": 字符串，清晰的编程题目描述，包括输入输出说明。
- "language": 字符串，编程语言（"%s"）。
【注意】编程题不需要"options"和"answer"字段。`, lang, lang))
	}

	// 4. 提供无可辩驳的JSON数组示例
	prompt.WriteString("\n\n你的输出**必须且只能**是如下格式的JSON数组：\n")
	prompt.WriteString(`[
  {
    "title": "这里填写第一道题的内容",
    "options": ["选项A内容", "选项B内容", "选项C内容", "选项D内容"],
    "answer": "A"
  },
  {
    "title": "这里填写第二道题的内容",
    "options": ["选项A内容", "选项B内容", "选项C内容", "选项D内容"],
    "answer": "B"
  }
]`)
	prompt.WriteString("\n\n现在，请开始严格按照上述格式生成题目。")

	return prompt.String()
}

// GenerateQuestions 调用API并解析响应
func (s *AIService) GenerateQuestions(ctx context.Context, prompt string) ([]map[string]interface{}, error) {
	// 调用Chat Completion接口（与官方示例一致）
	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: s.model,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "你是一个严谨的出题助手，必须严格遵守用户对输出格式的所有指令。",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.7, // 控制创造性
			MaxTokens:   2000,
		},
	)

	if err != nil {
		return nil, fmt.Errorf("调用AI接口失败: %v", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("AI返回内容为空")
	}

	aiResponseText := resp.Choices[0].Message.Content

	return parseAIResponseToJSON(aiResponseText)
}

// parseAIResponseToJSON 解析AI返回的文本为JSON（鲁棒性处理）
func parseAIResponseToJSON(aiText string) ([]map[string]interface{}, error) {
	cleanText := strings.TrimSpace(aiText)

	// 彻底清理可能包裹JSON的markdown代码块标记
	cleanText = strings.TrimPrefix(cleanText, "```json")
	cleanText = strings.TrimPrefix(cleanText, "```")
	cleanText = strings.TrimSuffix(cleanText, "```")
	cleanText = strings.TrimSpace(cleanText)

	// 有时AI会在JSON前后添加无关文本，尝试定位第一个'['和最后一个']'
	startIdx := strings.Index(cleanText, "[")
	endIdx := strings.LastIndex(cleanText, "]")

	if startIdx == -1 || endIdx == -1 || startIdx > endIdx {
		return nil, fmt.Errorf("在AI响应中未找到有效的JSON数组。响应开头：%s", cleanText[:min(100, len(cleanText))])
	}

	cleanText = cleanText[startIdx : endIdx+1]

	var result []map[string]interface{}
	if err := json.Unmarshal([]byte(cleanText), &result); err != nil {
		return nil, fmt.Errorf("解析AI返回的JSON失败。错误: %v\n已清理的文本：%s", err, cleanText)
	}

	return result, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
