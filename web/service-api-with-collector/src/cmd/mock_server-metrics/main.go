package main

import (
	"math/rand"
	"time"

	"github.com/gin-gonic/gin"
)

type Metric struct {
	StationID   string  `json:"station_id" db:"station_id" binding:"required"`
	Temperature float64 `json:"temperature" db:"temperature" binding:"required"`
	Humidity    float64 `json:"humidity" db:"humidity" binding:"required,min=0,max=100"`
	Pressure    float64 `json:"pressure" db:"pressure" binding:"required,min=700,max=1200"`
}

func main() {
	// Создаём новый генератор вместо использования глобального
	rnd := rand.New(rand.NewSource(time.Now().UnixNano()))

	r := gin.Default()

	r.GET("/metric", func(c *gin.Context) {
		metric := Metric{
			StationID:   "030a0070-1c8f-4723-a02f-7f7ae28ef995",
			Temperature: 15 + rnd.Float64()*20,  // от 15 до 35
			Humidity:    40 + rnd.Float64()*40,  // от 40 до 80
			Pressure:    740 + rnd.Float64()*30, // от 740 до 770
		}

		c.JSON(200, metric)
	})

	r.Run(":8081")
}
