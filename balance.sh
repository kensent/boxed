#!/usr/bin/env bash
# balance.sh — full balance run, all shards in PARALLEL.
#
# Pair count = C(N,2) where N is the harness roster size. Knight is currently
# excluded from the harness (see boxedshard.js EXCLUDE_IDS) so N=15 → 105
# matchups → 7 shards of 15. Re-include Knight by removing it from EXCLUDE_IDS
# AND updating the shard loop below back to 8 × 15 = 120.
#
# Usage:  ./balance.sh
#   Expects boxed.html, boxedshard.js, boxedmerge.js all in this directory.
#   Prints the MATCHUPS block + per-fighter win-rate summary.

set -e
cd "$(dirname "$0")"

RESULTS=()
PIDS=()

# 7 shards of 15 matchups each: [0,15) [15,30) ... [90,105)
for start in 0 15 30 45 60 75 90; do
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
