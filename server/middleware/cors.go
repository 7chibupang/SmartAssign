package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS 跨域中间件
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		origin := c.Request.Header.Get("Origin")

		// 允许的域名（支持通配符子域名）
		allowedDomains := []string{
			"localhost",
			"127.0.0.1",
		}

		// 如果是开发环境，允许所有localhost来源
		if origin != "" {
			for _, domain := range allowedDomains {
				if strings.Contains(origin, domain) {
					c.Header("Access-Control-Allow-Origin", origin)
					c.Header("Access-Control-Allow-Credentials", "true")
					break
				}
			}
		}

		// 其他CORS头
		c.Header("Access-Control-Allow-Headers", "Content-Type, AccessToken, X-CSRF-Token, Authorization, Token, X-Token")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")
		c.Header("Access-Control-Max-Age", "172800")

		// 放行所有OPTIONS方法
		if method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
