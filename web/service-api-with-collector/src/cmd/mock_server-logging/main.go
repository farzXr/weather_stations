package main

import (
	"time"

	"github.com/gin-gonic/gin"
)

type Status struct {
	Code      string    `json:"code"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

func main() {

	r := gin.Default()

	r.POST("/log", func(c *gin.Context) {
		var status Status
		err := c.ShouldBindJSON(&status)
		if err != nil {
			c.JSON(400, gin.H{"error": err})
		}
		c.JSON(200, status)
	})

	r.Run(":8082")
}
