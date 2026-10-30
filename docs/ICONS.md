# Functional SVG conventions
Use @fluentui/react-icons/svg/* Regular icons already installed in the project. Do not mix icon libraries or use emoji as controls.

- Review: ArrowRepeatAllRegular
- Library: LibraryRegular
- Personal collections: BookOpenRegular
- IELTS routes: MapRegular
- Rooms: PeopleTeamRegular
- Spelling Bee: HeadphonesRegular
- Word Rain: WeatherRainRegular
- Typing: KeyboardRegular
- Speedrun: FlashRegular
- Matching: GamesRegular
- Sniper: TargetArrowRegular
- Block board: GridRegular
- Pronunciation: MicRegular
- Playback: Speaker2Regular
- Hint: LightbulbRegular
- Pause/resume: PauseRegular / PlayRegular
- Save: BookmarkRegular / BookmarkFilled (saved state)
- Exit/close: ArrowExitRegular / DismissRegular

Button icons default to 20px, compact actions 16px, navigation 20px, heading marks 28px. Use currentColor and Fluent tokens. Keep a text label wherever practical. Icon-only buttons require aria-label, and tooltips when the meaning is not obvious. Decorative SVGs are aria-hidden and focusable=false. Do not force stroke-width onto filled path geometry from Fluent icons. Brand marks and game artwork are separate from functional icons.
