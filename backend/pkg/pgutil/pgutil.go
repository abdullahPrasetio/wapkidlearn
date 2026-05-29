package pgutil

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ParseUUID converts a string UUID into pgtype.UUID.
func ParseUUID(s string) (pgtype.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid UUID %q: %w", s, err)
	}
	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], id[:])
	pgUUID.Valid = true
	return pgUUID, nil
}

// UUIDToString converts pgtype.UUID to string.
func UUIDToString(u pgtype.UUID) string {
	return uuid.UUID(u.Bytes).String()
}

// NewUUID generates a new UUID as pgtype.UUID.
func NewUUID() pgtype.UUID {
	id := uuid.New()
	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], id[:])
	pgUUID.Valid = true
	return pgUUID
}

// PtrString returns pointer to string or nil.
func PtrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
