# OpenClaw Office media kit

Original promotional artwork and browser recordings for OpenClaw Office on AWTRIX NG. All agents, roles and tasks are fictional. The LED clock is a browser visualization, not a photograph of physical hardware. No Gateway connection or private credentials are used.

## Ready-to-use files

| File | Use |
| --- | --- |
| [hub-cover.gif](assets/hub-cover.gif) | Animated cover for the Hub; 960 × 540, 10 seconds, looping |
| [hub-cover.png](assets/hub-cover.png) | Static cover; 1600 × 900 |
| [cover-loop.mp4](assets/cover-loop.mp4) | Compact animated cover; 1600 × 900, 10 seconds |
| [showcase.mp4](assets/showcase.mp4) | Product film; 1600 × 900, 24 seconds |
| [01-hero.png](assets/01-hero.png) | Six Jelly bots: four working, two in the cafe |
| [02-small-team.png](assets/02-small-team.png) | Three Wisp bots, Decaf movement |
| [03-full-house.png](assets/03-full-house.png) | Eight Circuit bots, Espresso movement |
| [04-multiple-floors.png](assets/04-multiple-floors.png) | Twelve Orbit agents, first floor |
| [05-second-floor.png](assets/05-second-floor.png) | Twelve Wisp agents, second floor |
| [06-bot-styles.png](assets/06-bot-styles.png) | All sixteen supported bot styles |

The six gallery images are 1600 × 1000. Videos are silent H.264 MP4 files with fast-start metadata. The GIF is the recommended animated Hub cover. Its whole-office style changes demonstrate Jelly, Orbit, Wisp and Circuit. Upload limits have not been verified in an authenticated Hub submission form; these are prepared assets, not a published Hub listing.

## Story

The film starts with six agents. Researcher returns from the cafe when work starts; Writer takes a break after finishing a task. The film then shows a three-agent team, a full eight-agent office, a twelve-agent team across two floors, and several bot styles. Short animated captions and continuous camera moves keep the display as the focus. Every shot introduces an activity change, a team size, a floor or a bot style within three seconds. Film and cover movement run at 2× speed for presentation; the app’s timing is unchanged. All agents switch styles together in the customization sequence (Wisp, Circuit, Orbit and Jelly), matching the app’s office-wide style setting. Most agents are working in every scene. Changes in activity are illustrative, not real OpenClaw events.

The demo reuses the production browser layout, kitchen, bot sprites, caffeine profiles and movement code. Its custom renderer adds an LED effect and a stylized clock enclosure. Idle motion remains decorative and does not imply conversations between agents. The media does not demonstrate secure pairing or the installation process.

## Preview

From the repository root:

```sh
python3 -m http.server 8801 --bind 127.0.0.1
```

Open <http://127.0.0.1:8801/media/>. Buttons select a scene or play the film. Capture modes:

- `?scene=film&capture=1`: 24-second film, repeating.
- `?scene=cover&capture=1`: 10-second cover, repeating.
- `?scene=crew&capture=1&still=1`: deterministic six-agent still.
- `?scene=small&capture=1&still=1`: three-agent still.
- `?scene=busy&capture=1&still=1`: eight-agent still.
- `?scene=fleet&capture=1&still=1&floor=1&style=Wisp`: second floor of twelve agents.
- `?scene=styles&capture=1&still=1`: style gallery.

## Rebuild

Requires Python 3, curl, FFmpeg with libx264, and `agent-browser` with its browser installed. Screenshots and recordings are captured exclusively through `agent-browser`. FFmpeg encodes those recordings; it does not generate the product animation.

```sh
node --test media/scenes.test.mjs
bash media/capture.sh
```

Set `AGENT_BROWSER` to a binary path if it is not on PATH. Set `OFFICE_MEDIA_PORT` to choose a port (default 8802). Capture starts its own loopback server and browser session and closes both afterward. Re-running replaces the generated assets. Recorded animation timing can vary slightly with browser scheduling; still scenes use fixed seeds.

## Reference study

Reviewed on 26 October 2026:

- [AWTRIX scripts](https://awtrix.de/scripts): separate Hand-picked and Most installed selections.
- [Homelab Monitor](https://awtrix.de/script/lwRHc4KYgB0o): Hand-picked, animated GIF cover, six supporting gallery images; focused service states.
- [Pocket Wilds](https://awtrix.de/script/9DeXWjVB7Ch4): Hand-picked, animated GIF cover and six supporting images; shows changing game states on a clock visualization.
- [Now Playing for Spotify](https://awtrix.de/script/so6aPPJXcbht): Hand-picked, animated GIF cover and six supporting images.
- [Pixel Aquarium](https://awtrix.de/script/OlcCJsf8ARNX): present in the Most installed collection, animated GIF cover and five supporting images.

The useful pattern is a large, readable clock visualization, an animated first impression and a gallery of distinct states. These references use animated GIFs in their inspected main media, rather than embedded MP4 video players. Our artwork, enclosure styling, typography and copy are original; no reference images are included in this kit.

## Suggested listing copy

**Title:** OpenClaw Office

**Short description:** Your OpenClaw agents, at a glance. Working at their desks. Recharging in the cafe. A tiny office for your AWTRIX.

**Gallery order:** animated cover, six-agent hero, small team, full house, multiple floors, second floor, bot styles.

**Media caption:** Simulated OpenClaw activity on a visualization of a 52 × 16 AWTRIX display. Requires the OpenClaw Office bridge. Available activity depends on the Gateway events and synchronization state; cafe movement is decorative.
