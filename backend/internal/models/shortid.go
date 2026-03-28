package models

import (
	"crypto/rand"
	"math/big"
)

const (
	alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	idLen    = 12
	tokenLen = 24 // longer for security tokens (unsubscribe, etc.)
)

// NewID generates a 12-character URL-safe alphanumeric ID.
func NewID() string {
	return generate(idLen)
}

// NewToken generates a 24-character secure token.
func NewToken() string {
	return generate(tokenLen)
}

func generate(length int) string {
	max := big.NewInt(int64(len(alphabet)))
	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, max)
		b[i] = alphabet[n.Int64()]
	}
	return string(b)
}
