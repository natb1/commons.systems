package parse

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// parseOFXDate parses OFX date formats:
//   "20250522000000.000"         → plain timestamp
//   "20251023083735.186[-4:EDT]" → timestamp with timezone offset
//   "20251017120000"             → short form without fractional seconds
func parseOFXDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	// Strip timezone bracket suffix if present (e.g., "[-4:EDT]")
	if idx := strings.Index(s, "["); idx >= 0 {
		s = s[:idx]
	}
	// Strip fractional seconds if present
	if idx := strings.Index(s, "."); idx >= 0 {
		s = s[:idx]
	}
	if len(s) < 8 {
		return time.Time{}, fmt.Errorf("OFX date too short: %q", s)
	}
	// Parse YYYYMMDDHHMMSS or just YYYYMMDD
	switch len(s) {
	case 8:
		return time.Parse("20060102", s)
	case 14:
		return time.Parse("20060102150405", s)
	default:
		return time.Time{}, fmt.Errorf("unexpected OFX date format: %q", s)
	}
}

// parseOFXAmount parses an OFX amount string like "-16.19" or "400.00".
func parseOFXAmount(s string) (float64, error) {
	return strconv.ParseFloat(strings.TrimSpace(s), 64)
}
