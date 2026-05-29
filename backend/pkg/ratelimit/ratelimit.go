package ratelimit

import (
	"sync"
	"time"
)

type entry struct {
	count   int
	resetAt time.Time
}

type Limiter struct {
	mu      sync.Mutex
	entries map[string]*entry
}

func New() *Limiter {
	return &Limiter{
		entries: make(map[string]*entry),
	}
}

// Allow returns true if the key is within the rate limit.
func (l *Limiter) Allow(key string, maxAttempts int, window time.Duration) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	e, ok := l.entries[key]
	if !ok || now.After(e.resetAt) {
		l.entries[key] = &entry{count: 1, resetAt: now.Add(window)}
		return true
	}
	if e.count >= maxAttempts {
		return false
	}
	e.count++
	return true
}

// Reset clears the rate limit entry for the given key.
func (l *Limiter) Reset(key string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.entries, key)
}
