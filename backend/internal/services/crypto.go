package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"os"
)

var encryptionKey []byte

func InitEncryption() error {
	secret := os.Getenv("SESSION_SECRET")
	if secret == "" {
		secret = "waitless-dev-key-change-me-32!!" // 32 bytes for AES-256
	}
	// Pad or trim to exactly 32 bytes
	key := make([]byte, 32)
	copy(key, []byte(secret))
	encryptionKey = key
	return nil
}

func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", fmt.Errorf("cipher error: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("gcm error: %w", err)
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("nonce error: %w", err)
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func Decrypt(encoded string) (string, error) {
	if encoded == "" {
		return "", nil
	}

	ciphertext, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("base64 decode error: %w", err)
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", fmt.Errorf("cipher error: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("gcm error: %w", err)
	}

	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt error: %w", err)
	}

	return string(plaintext), nil
}
