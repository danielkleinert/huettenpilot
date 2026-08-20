# Hüttenplan 🏔️

**Live app**: [huettenpilot.netlify.app](https://huettenpilot.netlify.app)

Ever tried booking a multi-day Alpine hut tour during peak season? It's like playing Tetris with mountain reservations - you need consecutive nights across multiple huts, but availability is scattered and constantly changing. Hüttenplan solves this by intelligently finding date ranges where all your selected huts have beds available.

## When to use which tool

- **You know your route, but need to find dates that work** → use [Hüttenplan](https://huettenpilot.netlify.app). Pick your huts and see which consecutive nights have beds available across all of them.
- **You have fixed dates, but need to find a tour** → use the Alpenverein [Bettencheck](https://caa.alpenverein.at/service/bettencheck.html?). Enter your dates and discover which huts have availability.

**Data Source**: All availability data and bookings are powered exclusively by [`hut-reservation.org`](https://hut-reservation.org).

## MCP server

Hüttenplan also speaks [MCP](https://modelcontextprotocol.io), so an LLM can plan a tour
against live hut data. Connect it with:

```bash
claude mcp add --transport http huettenpilot https://huettenpilot.netlify.app/mcp
```

It exposes five read-only tools:

| Tool | Purpose |
|---|---|
| `search_huts` | Find huts by name and get their `hutId` |
| `find_huts_near` | List huts around a hut or coordinate, nearest first |
| `get_hut_details` | Altitude, warden, phone, bed categories, booking link |
| `get_hut_availability` | Free beds per night, up to 90 days per call |
| `create_tour_link` | Build a Hüttenplan URL that opens the planned tour |

Availability reaches about 500 days ahead — further than the 4-month calendar in the web
app. There is no booking, trail routing, or weather data: distances are straight-line, and
reservations still happen on [`hut-reservation.org`](https://hut-reservation.org).

## Background

Born from the pure frustration of manually checking dozens of hut websites for that perfect week in July, this project became an experiment in AI-driven development. How far could Claude Code take us? Turns out, pretty far - from concept to a fully functional app with 400+ huts, real-time availability, and multi-language support.

⚠️ **Fair warning**: I haven't looked at every line of generated slop, so this could fall apart any second now. Use at your own risk for actual hut bookings!

## Features

- **Smart Tour Planning**: Finds consecutive dates where all selected huts have enough beds
- **Real-time Availability**: Fetches current availability from [`hut-reservation.org`](https://hut-reservation.org)
- **Smart Hut Discovery**: Search bar finds huts nearest to your last selected hut for easy route planning
- **Mini Map**: Visual tour overview showing your route through the Alps
- **Drag & Drop Reordering**: Easily rearrange huts to optimize your route
- **Detailed Availability View**: See exact bed counts available at each hut for your tour dates
- **Direct Booking Links**: One-click access to official [`hut-reservation.org`](https://hut-reservation.org) booking pages and hut websites
- **400+ Alpine Huts**: Comprehensive database with accurate coordinates
- **Multi-language Support**: German, English, Italian, and French
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Automatic OS preference detection

## Technology Stack

See [CLAUDE.md](./CLAUDE.md) for detailed information about the technology stack, architecture, and development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file for details.