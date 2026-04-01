package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type QuestionType string

const (
	SingleChoice   QuestionType = "single_choice"
	MultipleChoice QuestionType = "multiple_choice"
	Programming    QuestionType = "programming"
)

type Difficulty string

const (
	Easy   Difficulty = "easy"
	Medium Difficulty = "medium"
	Hard   Difficulty = "hard"
)

type Question struct {
	ID         int64           `json:"id"`
	Type       QuestionType    `json:"type"`
	Difficulty Difficulty      `json:"difficulty"`
	Language   *string         `json:"language,omitempty"`
	Title      string          `json:"title"`
	Options    json.RawMessage `json:"options,omitempty"`
	Answer     json.RawMessage `json:"answer,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

type QuestionRequest struct {
	Type       QuestionType `json:"type" binding:"required"`
	Num        int          `json:"num" binding:"required,min=1,max=20"`
	Difficulty Difficulty   `json:"difficulty" binding:"required"`
	Language   *string      `json:"language,omitempty"`
}

type PaginationRequest struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"pageSize" binding:"min=1,max=50"`
	Type     string `form:"type"`
	Keyword  string `json:"keyword"`
}

// 实现Valuer接口
func (qt QuestionType) Value() (driver.Value, error) {
	return string(qt), nil
}

func (qt *QuestionType) Scan(value interface{}) error {
	if value == nil {
		return errors.New("question type is null")
	}
	s, ok := value.(string)
	if !ok {
		return errors.New("question type is not a string")
	}
	*qt = QuestionType(s)
	return nil
}

// 同样为Difficulty实现Valuer和Scanner接口
func (d Difficulty) Value() (driver.Value, error) {
	return string(d), nil
}

func (d *Difficulty) Scan(value interface{}) error {
	if value == nil {
		return errors.New("difficulty is null")
	}
	s, ok := value.(string)
	if !ok {
		return errors.New("difficulty is not a string")
	}
	*d = Difficulty(s)
	return nil
}
