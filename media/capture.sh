#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
browser_bin="${AGENT_BROWSER:-agent-browser}"
port="${OFFICE_MEDIA_PORT:-8802}"
session="office-showcase-capture"
output="$repo_dir/media/assets"
tmp_dir="$(mktemp -d)"
mkdir -p "$output"
python3 -m http.server "$port" --bind 127.0.0.1 --directory "$repo_dir" >"$tmp_dir/server.log" 2>&1 &
server_pid=$!
cleanup() {
  "$browser_bin" --session "$session" close >/dev/null 2>&1 || true
  kill "$server_pid" 2>/dev/null || true
  rm -rf "$tmp_dir"
}
trap cleanup EXIT
for attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:$port/media/" >/dev/null; then break; fi
  sleep 0.1
done
browser() { "$browser_bin" --session "$session" "$@"; }
base="http://127.0.0.1:$port/media/"
browser set viewport 1600 1000
for pair in 'crew:01-hero' 'small:02-small-team' 'busy:03-full-house' 'fleet:04-multiple-floors' 'styles:06-bot-styles'; do
  scene="${pair%%:*}"
  name="${pair#*:}"
  browser open "$base?scene=$scene&capture=1&still=1"
  browser screenshot "$output/$name.png"
done
browser open "$base?scene=fleet&capture=1&still=1&floor=1&style=Wisp"
browser screenshot "$output/05-second-floor.png"
browser set viewport 1600 900
browser open "$base?scene=film&capture=1&still=1"
browser record start "$tmp_dir/showcase.mp4" "$base?scene=film&capture=1" --fps 30
browser wait --fn 'document.querySelector("h1").textContent === "Meet your crew."'
sleep 24
browser record stop
ffmpeg -hide_banner -loglevel error -y -i "$tmp_dir/showcase.mp4" -t 24 -vf 'fps=30' -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -an "$output/showcase.mp4"
browser set viewport 1600 900
browser open "$base?scene=cover&capture=1&still=1"
browser screenshot "$output/hub-cover.png"
browser record start "$tmp_dir/cover.mp4" "$base?scene=cover&capture=1" --fps 30
sleep 10
browser record stop
ffmpeg -hide_banner -loglevel error -y -i "$tmp_dir/cover.mp4" -t 10 -vf 'fps=30' -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -an "$output/cover-loop.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$output/cover-loop.mp4" -filter_complex '[0:v]fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle' -loop 0 "$output/hub-cover.gif"
ffmpeg -hide_banner -loglevel error -y -i "$output/showcase.mp4" -filter_complex '[0:v]setpts=0.4*PTS,fps=10,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle' -t 9.6 -loop 0 "$output/awtrix-hub.gif"
printf 'Media saved to %s\n' "$output"
