package auth

import (
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgtype"
)

func parseUUID(s string) (pgtype.UUID, error) {
	return pgutil.ParseUUID(s)
}
