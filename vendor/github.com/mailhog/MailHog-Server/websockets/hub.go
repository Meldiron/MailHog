package websockets

import (
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/ian-kent/go-log/log"
)

type Hub struct {
	upgrader       websocket.Upgrader
	connections    map[*connection]bool
	messages       chan interface{}
	registerChan   chan *connection
	unregisterChan chan *connection
}

// NewHub creates a new Hub. corsOrigin can be empty (allow all),
// a single origin, or comma-separated list of allowed origins.
func NewHub(corsOrigin string) *Hub {
	hub := &Hub{
		connections:    make(map[*connection]bool),
		messages:       make(chan interface{}),
		registerChan:   make(chan *connection),
		unregisterChan: make(chan *connection),
	}

	hub.upgrader = websocket.Upgrader{
		ReadBufferSize:  256,
		WriteBufferSize: 4096,
		CheckOrigin: func(r *http.Request) bool {
			// If no CORS origin configured, allow all
			if len(corsOrigin) == 0 {
				return true
			}
			origin := r.Header.Get("Origin")
			if len(origin) == 0 {
				return true
			}
			// Check if origin is in the allowed list
			allowedOrigins := strings.Split(corsOrigin, ",")
			for _, allowed := range allowedOrigins {
				if strings.TrimSpace(allowed) == origin {
					return true
				}
			}
			return false
		},
	}

	go hub.run()
	return hub
}

func (h *Hub) run() {
	for {
		select {
		case c := <-h.registerChan:
			h.connections[c] = true
		case c := <-h.unregisterChan:
			h.unregister(c)
		case m := <-h.messages:
			for c := range h.connections {
				select {
				case c.send <- m:
				default:
					h.unregister(c)
				}
			}
		}
	}
}

func (h *Hub) unregister(c *connection) {
	if _, ok := h.connections[c]; ok {
		close(c.send)
		delete(h.connections, c)
	}
}

func (h *Hub) Serve(w http.ResponseWriter, r *http.Request) {
	ws, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	c := &connection{hub: h, ws: ws, send: make(chan interface{}, 256)}
	h.registerChan <- c
	go c.writeLoop()
	go c.readLoop()
}

func (h *Hub) Broadcast(data interface{}) {
	h.messages <- data
}
