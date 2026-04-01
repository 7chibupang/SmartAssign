package database

import (
	"database/sql"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB() error {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./database/questions.db"
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	// 初始化表
	initSQL, err := os.ReadFile("./database/init.sql")
	if err != nil {
		return err
	}

	_, err = DB.Exec(string(initSQL))
	if err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}
