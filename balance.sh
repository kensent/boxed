#!/usr/bin/env bash
# balance.sh — full 120-matchup balance run, all 8 shards in PARALLEL.
#
# In the chat sandbox the shards had to run sequentially (~1 core, parallel
# shards just contend). On a real multi-core machine this fires all 8 at once
# and a full run finishes in ~the time of the slowest single shard.
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
