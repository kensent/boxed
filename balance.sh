#!/usr/bin/env bash
# balance.sh — full balance run, all shards in PARALLEL.
#
# Pair count = C(N,2) where N is the harness roster size. With all 16 active
# (Knight replaced by Geomancer, EXCLUDE_IDS empty) → 120 matchups → 8 shards
# of 15. Update the shard loop below if a fighter is added or shelved.
#
# Usage:  ./balance.sh
#   Expects boxed.html, boxedshard.js, boxedmerge.js all in this directory.
#   Prints the MATCHUPS block + per-fighter win-rate summary.

set -e
cd "$(dirname "$0")"

RESULTS=()
PIDS=()

# 8 shards of 15 matchups each: [0,15) [15,30) ... [105,120)
for start in 0 15 30 45 60 75 90 105; do
  end=$((start + 15))
  out="/tmp/boxed-shard-${start}.txt"
  rm -f "$out"
  RESULTS+=("$out")
  node boxedshard.js "$start" "$end" "$out" &
  PIDS+=($!)
done

# Wait for every shard; fail loudly if any shard crashed.
fail=0
for pid in "${PIDS[@]}"; do
  if ! wait "$pid"; then fail=1; fi
done
if [ "$fail" -ne 0 ]; then
  echo "ERROR: a shard failed — results incomplete" >&2
  exit 1
fi

# Each shard wrote its own file, so no concurrent-append corruption.
node boxedmerge.js "${RESULTS[@]}"
