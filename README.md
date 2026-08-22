# 🏆 SportsCal

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**SportsCal** is a modern, fast, and intuitive sports calendar web application that aggregates game schedules, live scores, TV broadcast details, and match information across major global leagues into one unified interface. Built with a sleek dark aesthetic, smart filtering, and persistent user preferences, SportsCal ensures you never miss a game.

---

## ✨ Features

- 📅 **Unified Calendar Interface**: Effortlessly navigate through dates to view upcoming matches, ongoing games, and final results across all supported sports.
- 🏆 **Multi-League & Multi-Sport Coverage**: Track 12+ major domestic and international sports leagues:
  - **North American Leagues**: NFL, NBA, MLB, NHL, MLS
  - **European & Global Soccer**: Premier League (EPL), La Liga, UEFA Champions League, FIFA World Cup
  - **Motorsports & Fighting**: Formula 1 (F1 sessions & standings), UFC (fight cards & results)
  - **Global Events**: Olympic Games (Basketball & Soccer)
- ⭐ **Custom Favorites System**: Star your favorite leagues and individual teams for personalized views.
- 🎯 **"Favorites Only" & Visibility Toggles**: Filter out noise by switching to Favorites Only or toggling visibility for individual leagues and teams.
- ⚡ **Real-Time Data & Smart Caching**: Integrated directly with ESPN endpoints featuring an in-memory 3-minute TTL cache for quick date switching and minimal network overhead.
- 📺 **TV Broadcast & Location Info**: Quickly view match channels (e.g., ESPN, TNT, ABC, Sky Sports) and stadium/venue locations.
- 🔍 **Smart Team & City Search**: Built-in support for city aliases and abbreviations (e.g., searching `philly`, `la`, `ny`, `sf`, `kc`).
- 💾 **Persistent Settings**: Favorites, hidden leagues, and UI preferences are saved locally in `localStorage`.
- 🎨 **Premium Modern Design**: Designed with *Plus Jakarta Sans* typography, smooth micro-interactions, dark mode aesthetics, and full mobile responsiveness.

---

## 🏈 Supported Leagues & Sports

| Sport | League | Code | Features |
| :--- | :--- | :--- | :--- |
| **Football** | National Football League | `nfl` | Game schedules, scores, TV info, ESPN game center links |
| **Basketball** | National Basketball Association | `nba` | Live quarter clocks, scores, team stats |
| **Baseball** | Major League Baseball | `mlb` | Full regular season & playoff schedules, scores |
| **Ice Hockey** | National Hockey League | `nhl` | Period clocks, game status, network details |
| **College Football** | NCAA Football (FBS) | `ncaaf` | FBS teams & conferences, game schedules, scores, TV info |
| **College Basketball** | NCAA Men's Basketball | `ncaab` | D1 teams, game schedules, live scores, TV broadcasts |
| **Soccer** | Major League Soccer | `mls` | Eastern & Western Conference team coverage |
| **Soccer** | Premier League | `epl` | English Premier League fixture schedules & scores |
| **Soccer** | La Liga | `laliga` | Spanish top-flight football schedules |
| **Soccer** | UEFA Champions League | `champions` | European tournament fixtures & knockout stages |
| **Soccer** | FIFA World Cup | `worldcup` | International tournament fixture schedules |
| **Motorsport** | Formula 1 | `f1` | Grand Prix event schedules, practice/qualifying sessions |
| **Combat** | UFC | `ufc` | Main card & prelim fight listings with outcome status |
| **International**| Olympic Games | `olympics` | Olympic Men's & Women's Basketball and Soccer events |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript 6](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Linting**: [Oxlint](https://oxc.rs/)
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Data Source**: ESPN Public Scoreboard API

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18.0.0 or higher) and `npm` installed on your machine.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/EChesnut6/SportsCal.git
   cd SportsCal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev` — Launches the Vite development server with Hot Module Replacement (HMR).
- `npm run build` — Runs TypeScript type checking (`tsc -b`) and compiles production assets into `dist/`.
- `npm run preview` — Locally previews the built production app.
- `npm run lint` — Runs `oxlint` for lightning-fast code analysis and linting.

---

## 📂 Project Structure

```text
sportscal/
├── public/
│   └── favicon.svg         # Application brand icon
├── src/
│   ├── api.ts              # ESPN API fetching functions and caching layer
│   ├── App.tsx             # Main application component, layout, and state
│   ├── index.css           # Global design system, theme tokens, and CSS utility styles
│   ├── main.tsx            # React application entry point
│   ├── teamsData.ts        # Comprehensive directory of teams, logos, colors & leagues
│   └── types.ts            # TypeScript interfaces for games, teams, leagues & states
├── index.html              # HTML shell with Google Fonts & metadata
├── package.json            # Project dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
├── updates.md              # Feature roadmap and future updates tracker
└── README.md               # Project documentation
```

---

## 🛣️ Roadmap

Future enhancements planned for SportsCal:
- [ ] **NCAA College Sports**: Support for College Football (FBS) and College Basketball (NCAAB).
- [ ] **Alphabetical Team Sorting**: Enhanced sorting options in the league filter drawers.
- [ ] **Highlighted Days**: Visual indicators on the calendar for playoff games, season openers, and days with multiple favorite team matchups.
- [ ] **Calendar Export**: Export favorite team schedules to `.ics` / iCal / Google Calendar format.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.