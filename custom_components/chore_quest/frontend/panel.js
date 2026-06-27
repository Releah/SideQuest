class SideQuestPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loaded = true;
      this.load().catch((err) => this.renderFatal(err));
    }
  }

  async load() {
    this.innerHTML = `
      <style>
        :host,
        chore-quest-panel {
          display: block;
          min-height: 100vh;
          padding: 24px;
          box-sizing: border-box;
          color: #f7fbff;
          background:
            radial-gradient(circle at 18% 14%, rgba(0, 216, 255, 0.18) 0 1px, transparent 2px),
            radial-gradient(circle at 72% 26%, rgba(255, 207, 92, 0.16) 0 1px, transparent 2px),
            radial-gradient(circle at 44% 72%, rgba(124, 92, 255, 0.18) 0 1px, transparent 2px),
            linear-gradient(120deg, rgba(0, 216, 255, 0.07) 0 1px, transparent 1px 54px),
            linear-gradient(30deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 60px),
            linear-gradient(150deg, #07111f 0%, #0c1728 48%, #151327 100%);
          background-size: auto, auto, auto, 54px 54px, 60px 60px, auto;
          font-family: var(--primary-font-family, "Inter", "Segoe UI", sans-serif);
        }
        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        h1, h2, h3 {
          margin: 0;
          letter-spacing: 0;
        }
        h1 {
          font-size: 2.15rem;
          line-height: 1.05;
        }
        .brand-subtitle {
          margin-top: 4px;
        }
        .footer {
          margin-top: 24px;
          color: rgba(247,251,255,0.48);
          font-size: 0.78rem;
          text-align: right;
        }
        .tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }
        .home-button {
          border-color: rgba(255, 207, 92, 0.34);
          color: #ffcf5c;
        }
        button {
          border: 0;
          border-radius: 8px;
          padding: 10px 14px;
          background: #16a8d8;
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
          min-height: 40px;
        }
        button[disabled] {
          opacity: 0.55;
          cursor: default;
        }
        button.secondary {
          background: rgba(255,255,255,0.08);
          color: #f7fbff;
          border: 1px solid rgba(255,255,255,0.16);
        }
        button.danger {
          background: #c0392b;
          color: white;
        }
        .rating-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }
        .rating-actions button {
          min-width: 44px;
          padding: 8px 10px;
          background: rgba(0, 216, 255, 0.10);
          border: 1px solid rgba(122, 231, 255, 0.26);
          color: #ffcf5c;
        }
        .rating-actions .danger {
          min-width: auto;
          color: #ffffff;
        }
        .icon-button {
          min-width: 36px;
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 50%;
        }
        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          overflow: hidden;
          flex: 0 0 auto;
          background: linear-gradient(145deg, #00d8ff, #7c5cff);
          border: 2px solid rgba(214, 248, 255, 0.78);
          box-shadow: 0 0 22px rgba(0, 216, 255, 0.22);
          color: #ffffff;
          font-size: 1.35rem;
          font-weight: 800;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .avatar-copy {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .hero-title {
          display: grid;
          gap: 12px;
          margin-bottom: 12px;
        }
        .chore-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .chore-name {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        ha-icon {
          --mdc-icon-size: 22px;
          color: var(--primary-color);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .card {
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.24);
          backdrop-filter: blur(8px);
        }
        .store-image {
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          object-fit: cover;
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(122, 231, 255, 0.16);
        }
        .store-icon-fallback {
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(0,216,255,0.18), rgba(124,92,255,0.16));
          border: 1px solid rgba(122, 231, 255, 0.16);
        }
        .store-icon-fallback ha-icon {
          --mdc-icon-size: 42px;
          color: #ffcf5c;
        }
        .store-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .store-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 16px;
          align-items: start;
        }
        .store-main {
          min-width: 0;
        }
        .store-token-rail {
          position: sticky;
          top: 14px;
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          background: rgba(17, 40, 66, 0.88);
          border: 1px solid rgba(122, 231, 255, 0.22);
        }
        .store-token-section {
          display: grid;
          gap: 8px;
        }
        .store-token-section h3 {
          margin: 0;
          font-size: 0.95rem;
        }
        .token-mini-list {
          display: grid;
          gap: 8px;
        }
        .token-mini {
          display: grid;
          gap: 8px;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(122, 231, 255, 0.14);
        }
        .token-mini.redeemed {
          opacity: 0.72;
        }
        .token-mini h4 {
          margin: 0;
          font-size: 0.92rem;
        }
        .token-mini button {
          min-height: 32px;
          padding: 7px 9px;
        }
        .store-card {
          min-height: 0;
          gap: 10px;
          padding: 12px;
        }
        .quest-theme .store-card {
          min-height: 0;
          align-content: start;
        }
        .store-card .store-image,
        .store-card .store-icon-fallback {
          aspect-ratio: 1 / 1;
        }
        .store-card .quest-copy {
          gap: 6px;
        }
        .store-card .badge-list {
          gap: 4px;
        }
        .store-card .pill,
        .store-card .mission-badge {
          font-size: 0.72rem;
          padding: 4px 7px;
        }
        .store-card p.muted {
          margin: 0;
          font-size: 0.78rem;
        }
        .store-card h3 {
          font-size: 1rem;
        }
        .store-card button {
          min-height: 36px;
          padding: 8px 10px;
        }
        @media (max-width: 900px) {
          .store-layout {
            grid-template-columns: 1fr;
          }
          .store-token-rail {
            position: static;
          }
        }
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }
        .adjustment-box {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          align-items: end;
          padding: 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(122, 231, 255, 0.16);
        }
        .adjustment-box h2 {
          grid-column: 1 / -1;
        }
        .money {
          height: 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          overflow: hidden;
          margin: 12px 0;
        }
        .money > div {
          height: 100%;
          background: linear-gradient(90deg, #2f7df6, #ffb000);
        }
        .quest-theme {
          color: #eaf8ff;
        }
        .quest-theme .card,
        .quest-theme .hero-main {
          color: #f7fbff;
          background:
            linear-gradient(135deg, rgba(14, 32, 54, 0.92), rgba(22, 25, 54, 0.86)),
            rgba(7, 17, 31, 0.84);
          border: 1px solid rgba(122, 231, 255, 0.22);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.06),
            0 18px 34px rgba(0, 0, 0, 0.30);
          backdrop-filter: blur(10px);
        }
        .quest-theme .muted,
        .quest-theme .stat span {
          color: rgba(214, 239, 255, 0.72);
        }
        .quest-theme .pill {
          background: rgba(0, 216, 255, 0.12);
          border-color: rgba(122, 231, 255, 0.24);
          color: #dff8ff;
        }
        .quest-theme .money {
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(122, 231, 255, 0.24);
        }
        .quest-theme .money > div {
          background: linear-gradient(90deg, #00d8ff, #7c5cff, #ffcf5c);
          box-shadow: 0 0 18px rgba(0, 216, 255, 0.45);
        }
        .quest-board {
          padding: 18px;
          border-radius: 18px;
          background:
            radial-gradient(circle at 8% 10%, rgba(0, 216, 255, 0.16), transparent 28%),
            radial-gradient(circle at 92% 12%, rgba(255, 207, 92, 0.12), transparent 24%),
            linear-gradient(160deg, rgba(5, 15, 30, 0.94), rgba(12, 13, 31, 0.98));
          border: 1px solid rgba(122, 231, 255, 0.22);
          box-shadow: 0 28px 60px rgba(0,0,0,0.44);
        }
        .quest-giver {
          display: grid;
          grid-template-columns: 76px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          margin-bottom: 16px;
          padding: 14px;
          border-radius: 14px;
          background:
            linear-gradient(135deg, rgba(0, 216, 255, 0.14), rgba(124, 92, 255, 0.11)),
            rgba(5, 13, 27, 0.74);
          border: 1px solid rgba(122, 231, 255, 0.22);
        }
        .quest-giver-badge {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #00d8ff, #7c5cff);
          border: 2px solid rgba(214, 248, 255, 0.78);
          box-shadow:
            inset 0 0 16px rgba(255,255,255,0.22),
            0 0 24px rgba(0, 216, 255, 0.26);
        }
        .quest-giver-badge ha-icon {
          --mdc-icon-size: 42px;
          color: #ffffff;
        }
        .quest-giver h2 {
          color: #f7fbff;
        }
        .quest-giver .muted {
          color: rgba(214, 239, 255, 0.78);
        }
        .muted {
          color: rgba(247,251,255,0.72);
          font-size: 0.92rem;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(247,251,255,0.82);
          font-size: 0.84rem;
          font-weight: 700;
        }
        .badge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .mission-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255, 207, 92, 0.13);
          border: 1px solid rgba(255, 207, 92, 0.28);
          color: #ffe7a3;
          font-size: 0.82rem;
          font-weight: 800;
        }
        .rank-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          margin-top: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          background: linear-gradient(135deg, rgba(255, 207, 92, 0.18), rgba(0, 216, 255, 0.13));
          border: 1px solid rgba(255, 207, 92, 0.32);
          color: #ffffff;
          font-weight: 800;
        }
        .rank-badge ha-icon {
          --mdc-icon-size: 20px;
          color: #ffcf5c;
        }
        .mission-complete {
          opacity: 0.58;
        }
        .task-table,
        .manager-table {
          grid-column: 1 / -1;
          overflow-x: auto;
          border: 1px solid rgba(122, 231, 255, 0.16);
          border-radius: 10px;
        }
        .task-table table,
        .manager-table table {
          width: 100%;
          min-width: 780px;
          border-collapse: collapse;
        }
        .manager-table table {
          min-width: 1180px;
        }
        .task-table th,
        .task-table td,
        .manager-table th,
        .manager-table td {
          padding: 8px;
          border-bottom: 1px solid rgba(122, 231, 255, 0.12);
          text-align: left;
          vertical-align: top;
        }
        .task-table th,
        .manager-table th {
          color: #dff8ff;
          font-size: 0.84rem;
        }
        .task-table th span,
        .manager-table th span {
          display: block;
          color: rgba(214, 239, 255, 0.62);
          font-size: 0.74rem;
          font-weight: 500;
          margin-top: 2px;
        }
        .task-table input,
        .task-table select,
        .manager-table input,
        .manager-table select {
          min-width: 90px;
        }
        .task-table .task-name {
          min-width: 180px;
        }
        .task-table .task-description {
          min-width: 220px;
        }
        .chore-groups {
          display: grid;
          gap: 18px;
        }
        .player-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0 16px;
        }
        .player-filter button.active {
          background: linear-gradient(135deg, rgba(0, 216, 255, 0.24), rgba(124, 92, 255, 0.18));
          border-color: rgba(122, 231, 255, 0.42);
        }
        .chore-group {
          display: grid;
          gap: 12px;
        }
        .chore-editor {
          display: grid;
          gap: 10px;
          padding: 14px;
          border: 1px solid rgba(122, 231, 255, 0.16);
          border-radius: 10px;
          background: rgba(255,255,255,0.035);
        }
        .chore-editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          text-align: left;
        }
        .chore-editor-header strong {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chore-editor-body {
          display: none;
          gap: 10px;
        }
        .chore-editor.open .chore-editor-body {
          display: grid;
        }
        .chore-editor-line {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
          align-items: end;
        }
        .chore-editor-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .icon-picker {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
        }
        .icon-picker-menu {
          position: absolute;
          z-index: 20;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          max-height: 320px;
          overflow: auto;
          padding: 10px;
          border-radius: 12px;
          background: #101a28;
          border: 1px solid rgba(122, 231, 255, 0.28);
          box-shadow: 0 18px 36px rgba(0,0,0,0.42);
        }
        .icon-picker-menu[hidden] {
          display: none;
        }
        .icon-picker-search {
          grid-column: 1 / -1;
        }
        .icon-picker-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }
        .icon-option {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr);
          gap: 8px;
          align-items: center;
          min-height: 44px;
          padding: 8px;
          text-align: left;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .icon-option strong,
        .icon-option span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .icon-option span {
          color: rgba(247,251,255,0.62);
          font-size: 0.78rem;
        }
        .check-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .check-row input {
          width: auto;
        }
        .notice {
          margin: 0 0 16px;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--secondary-background-color);
          border: 1px solid var(--divider-color);
        }
        .notice.error {
          border-color: #c0392b;
          color: #c0392b;
        }
        .admin-panel {
          margin-top: 18px;
        }
        .admin-shell {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        .admin-nav {
          position: sticky;
          top: 12px;
          display: grid;
          gap: 8px;
        }
        .admin-nav button {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-start;
          text-align: left;
        }
        .admin-nav ha-icon {
          --mdc-icon-size: 20px;
        }
        .admin-nav button.active {
          background: linear-gradient(135deg, rgba(0, 216, 255, 0.24), rgba(124, 92, 255, 0.18));
          border-color: rgba(122, 231, 255, 0.42);
          color: #ffffff;
        }
        .admin-section {
          display: none;
        }
        .admin-section.active {
          display: block;
        }
        .admin-panel h2 {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-panel h2 ha-icon {
          --mdc-icon-size: 24px;
          color: #ffcf5c;
        }
        .stat {
          display: grid;
          gap: 6px;
          min-height: 92px;
        }
        .stat strong {
          font-size: 1.55rem;
        }
        .stat span {
          color: rgba(247,251,255,0.72);
          font-size: 0.9rem;
        }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid rgba(255,255,255,0.12);
          padding-top: 12px;
          margin-top: 12px;
        }
        form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          align-items: end;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 0.9rem;
        }
        input, select, textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.16);
          background: #151f2d;
          color: #f7fbff;
          color-scheme: dark;
        }
        textarea {
          min-height: 96px;
          resize: vertical;
          font-family: inherit;
        }
        select option {
          background: #151f2d;
          color: #f7fbff;
        }
        select option:checked {
          background: #0b5d7a;
          color: #ffffff;
        }
        input::placeholder {
          color: rgba(247,251,255,0.46);
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
          gap: 18px;
          align-items: stretch;
          margin-bottom: 22px;
        }
        .hero-main {
          padding: 22px;
          border-radius: 16px;
          background:
            linear-gradient(135deg, rgba(22,168,216,0.24), rgba(255,176,0,0.14)),
            rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 18px 42px rgba(0,0,0,0.24);
          min-height: 210px;
          display: grid;
          align-content: center;
        }
        .hero-main h2 {
          font-size: 2rem;
        }
        .hero-side {
          display: grid;
          align-content: center;
        }
        .quest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .quest-card {
          min-height: 190px;
          display: grid;
          align-content: space-between;
          gap: 12px;
          background:
            linear-gradient(150deg, rgba(255,255,255,0.10), rgba(255,255,255,0.055)),
            rgba(255,255,255,0.05);
        }
        .quest-theme .quest-card {
          position: relative;
          border-radius: 14px;
          min-height: 210px;
          background:
            linear-gradient(160deg, rgba(17, 40, 66, 0.95), rgba(28, 31, 64, 0.88)),
            rgba(7, 17, 31, 0.86);
        }
        .quest-theme .quest-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(0, 216, 255, 0.28), transparent 38%, rgba(255, 207, 92, 0.12));
          opacity: 0.45;
          pointer-events: none;
        }
        .quest-card ha-icon {
          --mdc-icon-size: 38px;
          color: #ffcf5c;
        }
        .quest-theme .quest-card ha-icon {
          color: #00d8ff;
        }
        .quest-card button:not(.icon-button) {
          width: 100%;
          min-height: 44px;
        }
        .quest-theme .quest-card button:not(.icon-button) {
          background: linear-gradient(180deg, #00c2ff, #005dff);
          color: #ffffff;
          border: 1px solid rgba(122, 231, 255, 0.52);
          box-shadow: 0 0 20px rgba(0, 194, 255, 0.22);
        }
        .mission-task-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .mission-task-tile {
          display: grid;
          gap: 10px;
          align-content: space-between;
          min-height: 152px;
          padding: 14px;
          border-radius: 12px;
          background:
            linear-gradient(150deg, rgba(0, 216, 255, 0.12), rgba(124, 92, 255, 0.10)),
            rgba(3, 12, 24, 0.34);
          border: 1px solid rgba(122, 231, 255, 0.22);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
        }
        .mission-task-tile.is-complete {
          border-color: rgba(61, 220, 151, 0.40);
          background:
            linear-gradient(150deg, rgba(61, 220, 151, 0.16), rgba(0, 216, 255, 0.08)),
            rgba(3, 12, 24, 0.34);
        }
        .mission-task-tile.is-pending {
          border-color: rgba(255, 207, 92, 0.34);
          background:
            linear-gradient(150deg, rgba(255, 207, 92, 0.14), rgba(124, 92, 255, 0.08)),
            rgba(3, 12, 24, 0.34);
        }
        .mission-task-tile h4 {
          margin: 0;
          font-size: 1rem;
          line-height: 1.2;
        }
        .mission-task-tile .pill {
          width: fit-content;
          margin-top: 8px;
        }
        .quest-theme button.secondary {
          background: rgba(0, 216, 255, 0.10);
          border-color: rgba(122, 231, 255, 0.28);
          color: #dff8ff;
        }
        .quest-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .quest-copy {
          display: grid;
          gap: 8px;
        }
        .house-card {
          position: relative;
          overflow: hidden;
          min-height: 138px;
        }
        .house-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(76,168,184,0.14), rgba(247,206,104,0.16));
          pointer-events: none;
        }
        .house-card > * {
          position: relative;
        }
        .section-title {
          margin: 24px 0 12px;
          font-size: 1.25rem;
        }
        .scoreboard {
          margin-top: 28px;
        }
        .empty-state {
          padding: 18px 20px;
        }
        .empty-state p {
          margin: 0;
        }
        @media (max-width: 760px) {
          :host,
          chore-quest-panel {
            padding: 14px 16px;
          }
          .top, .hero {
            grid-template-columns: 1fr;
          }
          .top {
            display: grid;
          }
          .tabs {
            justify-content: flex-start;
          }
          h1 {
            font-size: 1.8rem;
          }
          .hero-main {
            min-height: 180px;
          }
          .quest-board {
            padding: 12px;
          }
          .quest-giver {
            grid-template-columns: 56px minmax(0, 1fr);
          }
          .quest-giver-badge {
            width: 56px;
            height: 56px;
          }
          .quest-giver-badge ha-icon {
            --mdc-icon-size: 32px;
          }
          .row {
            align-items: stretch;
            flex-direction: column;
          }
          .admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-nav {
            position: static;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }
          .rating-actions {
            justify-content: flex-start;
          }
        }
      </style>
      <div class="wrap">
        <div class="top">
          <div>
            <h1>SideQuest</h1>
            <div class="muted brand-subtitle">Chores, approvals, rewards, and weekly treasure.</div>
          </div>
          <div class="tabs">
            <button class="secondary home-button" id="home-tab">Home</button>
            <button class="secondary" id="kid-tab">Kid View</button>
            <button class="secondary" id="dashboard-tab">Dashboard</button>
            <button class="secondary" id="store-tab">Store</button>
            <button class="secondary" id="tokens-tab">Tokens</button>
            <button class="secondary" id="admin-tab">Admin</button>
          </div>
        </div>
        <div id="notice"></div>
        <div id="content">Loading SideQuest...</div>
        <div id="footer"></div>
      </div>
    `;

    if (!this.isAdmin()) {
      this.querySelector("#admin-tab").style.display = "none";
    } else {
      this.querySelector("#footer").innerHTML = `<div class="footer">SideQuest panel v20260627-xp-balance-split</div>`;
    }

    this.querySelector("#home-tab").addEventListener("click", () => {
      this.navigateHome();
    });
    this.querySelector("#kid-tab").addEventListener("click", () => {
      this.renderKid().catch((err) => this.renderFatal(err));
    });
    this.querySelector("#admin-tab").addEventListener("click", () => {
      this.renderAdmin().catch((err) => this.renderFatal(err));
    });
    this.querySelector("#dashboard-tab").addEventListener("click", () => {
      if (this.me?.child && !this.me?.is_kitchen) {
        this.renderKidDashboard().catch((err) => this.renderFatal(err));
      } else {
        this.renderKitchen().catch((err) => this.renderFatal(err));
      }
    });
    this.querySelector("#store-tab").addEventListener("click", () => {
      this.renderStore().catch((err) => this.renderFatal(err));
    });
    this.querySelector("#tokens-tab").addEventListener("click", () => {
      this.renderTokens().catch((err) => this.renderFatal(err));
    });

    await this.refresh();
    if (this.me.child && !this.me.is_kitchen) {
      this.querySelector("#dashboard-tab").textContent = "House Missions";
    }
    if (!this.isAdmin() && !this.me.is_kitchen && !this.me.child) {
      this.querySelector("#dashboard-tab").style.display = "none";
    }
    await this.renderKid();
  }

  isAdmin() {
    return Boolean(this._hass && this._hass.user && this._hass.user.is_admin);
  }

  navigateHome() {
    const homePath = "/";
    if (this._hass && typeof this._hass.navigate === "function") {
      this._hass.navigate(homePath);
      return;
    }
    window.history.pushState(null, "", homePath);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  renderFatal(err) {
    const message = err && err.message ? err.message : String(err);
    console.error("SideQuest panel failed", err);
    this.innerHTML = `
      <div style="padding:24px">
        <h1>SideQuest</h1>
        <div style="border:1px solid #c0392b;color:#c0392b;padding:12px;border-radius:8px">
          ${this.escapeHtml(message)}
        </div>
      </div>
    `;
  }

  setNotice(message, error) {
    const notice = this.querySelector("#notice");
    if (!notice) return;
    notice.innerHTML = message
      ? `<div class="notice ${error ? "error" : ""}">${this.escapeHtml(message)}</div>`
      : "";
  }

  async runAction(message, action) {
    try {
      this.setNotice("");
      await action();
      if (message) this.setNotice(message, false);
    } catch (err) {
      console.error("SideQuest action failed", err);
      this.setNotice(err && err.message ? err.message : String(err), true);
    }
  }

  async refresh() {
    this.data = await this._hass.callWS({ type: "chore_quest/list" });
    this.me = await this._hass.callWS({ type: "chore_quest/me" });
    this.data.children = this.data.children || [];
    this.data.chores = this.data.chores || [];
    this.data.claims = this.data.claims || {};
    this.data.anyone_quests = this.data.anyone_quests || [];
    this.data.anyone_claims = this.data.anyone_claims || {};
    this.data.anyone_quests_due = this.data.anyone_quests_due || [];
    this.data.history = this.data.history || [];
    this.data.global_missions = this.data.global_missions || [];
    this.data.global_mission_templates = this.data.global_mission_templates || [];
    this.data.store_items = this.data.store_items || [];
    this.data.store_tokens = this.data.store_tokens || [];
    this.data.weekly_totals = this.data.weekly_totals || {};
    this.data.xp_totals = this.data.xp_totals || {};
    this.data.xp_lifetime_totals = this.data.xp_lifetime_totals || {};
  }

  async refreshUsers() {
    if (!this.isAdmin()) {
      this.users = [];
      return;
    }
    try {
      this.users = await this._hass.callWS({ type: "chore_quest/users" });
    } catch (err) {
      console.error("SideQuest user import failed", err);
      this.users = [];
      this.setNotice(
        "Could not load Home Assistant users. You can still add a child, but the user dropdown is unavailable.",
        true,
      );
    }
  }

  childName(childId) {
    const child = this.data.children.find((item) => item.id === childId);
    return child ? child.name : childId;
  }

  childProfile(child) {
    const userId = (child.user_ids || [])[0];
    return userId ? (this.data.user_profiles || {})[userId] : null;
  }

  avatarHtml(child) {
    const profile = this.childProfile(child);
    const avatarUrl = profile && profile.avatar_url;
    const initials = this.initials(child.name);
    if (avatarUrl) {
      return `<div class="avatar"><img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(child.name)} avatar"></div>`;
    }
    return `<div class="avatar" aria-label="${this.escapeHtml(child.name)} avatar">${this.escapeHtml(initials)}</div>`;
  }

  initials(name) {
    return String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "?";
  }

  scheduleLabel(schedule) {
    if (schedule && schedule.type === "none") return "No schedule";
    if (!schedule || schedule.type === "daily") return "Daily";
    if (schedule.type === "days") {
      const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return (schedule.days || []).map((day) => names[day]).join(", ");
    }
    return "Daily";
  }

  claimState(choreId) {
    return this.data.claims[choreId] ? this.data.claims[choreId].status : "open";
  }

  anyoneClaimState(questId) {
    const claim = Object.values(this.data.anyone_claims || {}).find((item) => item.quest_id === questId);
    return claim ? claim.status : "open";
  }

  async renderKid() {
    await this.refresh();
    const content = this.querySelector("#content");
    if (!this.me.child) {
      if (this.isAdmin()) {
        content.innerHTML = `<div class="card"><h2>Parent account</h2><p class="muted">Use the Admin tab to manage chores and approvals.</p></div>`;
        return;
      }
      if (this.me.is_kitchen) {
        await this.renderKitchen();
      } else {
        content.innerHTML = `<div class="card"><h2>No SideQuest view linked</h2><p class="muted">Ask an admin to link this Home Assistant user to a child or the kitchen dashboard.</p></div>`;
      }
      return;
    }

    const child = this.me.child;
    const total = Number(this.data.weekly_totals[child.id] || 0);
    const goal = Number(child.goal || 10);
    const pct = Math.min(100, Math.round((total / goal) * 100));
    const lifetimeXp = Number(this.data.xp_lifetime_totals[child.id] ?? this.data.xp_totals[child.id] ?? 0);
    const rank = this.rankForXp(lifetimeXp);
    const chores = this.me.chores || [];
    const anyoneQuests = this.me.anyone_quests || this.data.anyone_quests_due || [];
    const pendingCount = chores.filter((chore) => this.claimState(chore.id) === "pending").length;
    const anyonePendingCount = anyoneQuests.filter((quest) => this.anyoneClaimState(quest.id) === "pending").length;
    const readyCount = Math.max(0, chores.length + anyoneQuests.length - pendingCount - anyonePendingCount);
    const avatar = this.avatarHtml(child);

    content.innerHTML = `
      <div class="quest-theme quest-board">
        <div class="quest-giver">
          <div class="quest-giver-badge"><ha-icon icon="mdi:rocket-launch"></ha-icon></div>
          <div>
            <h2>Mission board</h2>
            <p class="muted">Choose a mission, complete it, and send it to the grown-ups for approval.</p>
          </div>
        </div>
        <div class="hero">
          <div class="hero-main">
            <div class="hero-title">
              <span class="pill">Weekly quest</span>
              <div class="avatar-row">
                ${avatar}
                <h2>${this.escapeHtml(child.name)}'s SideQuest</h2>
              </div>
            </div>
            <p class="muted">Fill the treasure bar by finishing quests and getting them approved.</p>
            <div class="money"><div style="width:${pct}%"></div></div>
            <strong>GBP ${total.toFixed(2)} / GBP ${goal.toFixed(2)}</strong>
            ${this.rankBadge(rank, lifetimeXp)}
          </div>
          <div class="card hero-side">
            <span class="pill">Today</span>
            <h2>${readyCount} ready</h2>
            <p class="muted">${pendingCount} waiting for approval</p>
          </div>
        </div>
        <h2 class="section-title">Quests to choose</h2>
        <div class="quest-grid">
          ${chores.length ? chores.map((chore) => this.kidChoreCard(chore)).join("") : `<div class="card empty-state"><p class="muted">Mission control is clear right now.</p></div>`}
        </div>
        <h2 class="section-title">Anyone quests</h2>
        <div class="quest-grid">
          ${anyoneQuests.length ? anyoneQuests.map((quest) => this.anyoneQuestCard(quest, child)).join("") : `<div class="card empty-state"><p class="muted">No shared quests are open right now.</p></div>`}
        </div>
      </div>
    `;

    content.querySelectorAll("[data-claim]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Quest sent for approval.", async () => {
          const chore = this.data.chores.find((item) => item.id === button.dataset.claim) || {};
          await this._hass.callService("chore_quest", "claim_chore", {
            chore_id: button.dataset.claim,
            quantity: this.claimQuantity(chore),
          });
          await this.renderKid();
        });
      });
    });
    content.querySelectorAll("[data-claim-anyone]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Shared quest sent for approval.", async () => {
          const quest = this.data.anyone_quests.find((item) => item.id === button.dataset.claimAnyone) || {};
          await this._hass.callService("chore_quest", "claim_anyone_quest", {
            quest_id: button.dataset.claimAnyone,
            child_id: child.id,
            quantity: this.claimQuantity(quest),
          });
          await this.renderKid();
        });
      });
    });
    this.bindInfoButtons(content);
  }

  async renderKidDashboard() {
    await this.refresh();
    const content = this.querySelector("#content");
    const child = this.me.child;
    if (!child) {
      await this.renderKid();
      return;
    }

    const activeMissions = this.activeGlobalMissions();
    const openTasks = activeMissions.reduce(
      (count, mission) => count + (mission.tasks || []).filter((task) => (task.status || "open") === "open").length,
      0,
    );
    const pendingTasks = activeMissions.reduce(
      (count, mission) => count + (mission.tasks || []).filter((task) => (task.status || "open") === "pending").length,
      0,
    );

    content.innerHTML = `
      <div class="quest-theme quest-board">
        <div class="quest-giver">
          <div class="quest-giver-badge"><ha-icon icon="mdi:space-station"></ha-icon></div>
          <div>
            <h2>House mission dashboard</h2>
            <p class="muted">Choose a house mission, claim a task, and help unlock the next thing.</p>
          </div>
        </div>
        <div class="hero">
          <div class="hero-main">
            <div class="avatar-row">
              ${this.avatarHtml(child)}
              <div>
                <span class="pill">Mission control</span>
                <h2>${this.escapeHtml(child.name)}'s global missions</h2>
              </div>
            </div>
            <p class="muted">Global missions are bigger house objectives made from smaller tasks.</p>
          </div>
          <div class="card hero-side">
            <span class="pill">House tasks</span>
            <h2>${openTasks} open</h2>
            <p class="muted">${pendingTasks} waiting for approval</p>
          </div>
        </div>
        <h2 class="section-title">Anyone quests</h2>
        <div class="quest-grid">
          ${(this.me.anyone_quests || this.data.anyone_quests_due || []).length ? (this.me.anyone_quests || this.data.anyone_quests_due || []).map((quest) => this.anyoneQuestCard(quest, child)).join("") : `<div class="card empty-state"><p class="muted">No shared quests are open right now.</p></div>`}
        </div>
        <h2 class="section-title">Global missions</h2>
        <div class="quest-grid">
          ${activeMissions.length ? activeMissions.map((mission) => this.globalMissionCard(mission, child)).join("") : `<div class="card empty-state"><p class="muted">No global missions posted right now.</p></div>`}
        </div>
      </div>
    `;

    content.querySelectorAll("[data-claim-anyone]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Shared quest sent for approval.", async () => {
          const quest = this.data.anyone_quests.find((item) => item.id === button.dataset.claimAnyone) || {};
          await this._hass.callService("chore_quest", "claim_anyone_quest", {
            quest_id: button.dataset.claimAnyone,
            child_id: child.id,
            quantity: this.claimQuantity(quest),
          });
          await this.renderKidDashboard();
        });
      });
    });
    content.querySelectorAll("[data-claim-global-task]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Mission task claimed.", async () => {
          await this._hass.callService("chore_quest", "claim_global_task", {
            mission_id: button.dataset.missionId,
            task_id: button.dataset.taskId,
            child_id: child.id,
          });
          await this.renderKidDashboard();
        });
      });
    });
  }

  async renderKitchen(selectedChildId) {
    await this.refresh();
    const content = this.querySelector("#content");
    const selectedChild = this.data.children.find((child) => child.id === selectedChildId) || this.data.children[0];
    let chores = [];
    if (selectedChild) {
      chores = await this._hass.callWS({ type: "chore_quest/child_chores", child_id: selectedChild.id });
    }

    const stats = this.dashboardStats();
    content.innerHTML = `
      <div class="quest-theme quest-board">
        <div class="quest-giver">
          <div class="quest-giver-badge"><ha-icon icon="mdi:space-station"></ha-icon></div>
          <div>
            <h2>Command deck</h2>
            <p class="muted">Pick a player, choose a mission, and keep the household scoreboard moving.</p>
          </div>
        </div>
        <div class="compact-grid">
          ${this.statCard("This week", `GBP ${stats.totalWeek.toFixed(2)}`, "Household rewards earned")}
          ${this.statCard("This year", `GBP ${stats.totalYear.toFixed(2)}`, "Total SideQuest rewards")}
          ${this.statCard("Quests won", String(stats.completedWeek), "Approved this week")}
          ${this.statCard("Pending", String(stats.pendingCount), "Waiting for approval")}
          ${this.statCard("Top this week", stats.topChildName, `GBP ${stats.topChildTotal.toFixed(2)}`)}
          ${this.statCard("Year quests", String(stats.completedYear), "Approved this year")}
        </div>
        <h2 class="section-title scoreboard">House scoreboard</h2>
        <div class="grid">
          ${this.data.children.length ? this.data.children.map((child) => this.kitchenChildCard(child, selectedChild && child.id === selectedChild.id)).join("") : `<div class="card empty-state"><p class="muted">No players have been added yet.</p></div>`}
        </div>
        <div class="card" style="margin-top:18px">
          <h2>${selectedChild ? this.escapeHtml(selectedChild.name) : "No children"}'s quests</h2>
          <div class="quest-grid" style="margin-top:14px">
            ${chores.length ? chores.map((chore) => this.kidChoreCard(chore)).join("") : `<p class="muted">No available quests right now.</p>`}
          </div>
        </div>
        <h2 class="section-title">Anyone quests</h2>
        <div class="quest-grid">
          ${(this.data.anyone_quests_due || []).length ? (this.data.anyone_quests_due || []).map((quest) => this.anyoneQuestCard(quest, selectedChild)).join("") : `<div class="card empty-state"><p class="muted">No shared quests are open right now.</p></div>`}
        </div>
        <h2 class="section-title">Global missions</h2>
        <div class="quest-grid">
          ${this.activeGlobalMissions().length ? this.activeGlobalMissions().map((mission) => this.globalMissionCard(mission, selectedChild)).join("") : `<div class="card empty-state"><p class="muted">No global missions posted right now.</p></div>`}
        </div>
      </div>
    `;

    content.querySelectorAll("[data-select-child]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.renderKitchen(button.dataset.selectChild);
      });
    });

    content.querySelectorAll("[data-claim]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!selectedChild) {
          this.setNotice("Add a player before claiming quests.", true);
          return;
        }
        await this.runAction("Quest sent for approval.", async () => {
          const chore = this.data.chores.find((item) => item.id === button.dataset.claim) || {};
          await this._hass.callService("chore_quest", "claim_chore", {
            chore_id: button.dataset.claim,
            quantity: this.claimQuantity(chore),
          });
          await this.renderKitchen(selectedChild.id);
        });
      });
    });
    content.querySelectorAll("[data-claim-anyone]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!selectedChild) {
          this.setNotice("Add a player before claiming shared quests.", true);
          return;
        }
        await this.runAction("Shared quest sent for approval.", async () => {
          const quest = this.data.anyone_quests.find((item) => item.id === button.dataset.claimAnyone) || {};
          await this._hass.callService("chore_quest", "claim_anyone_quest", {
            quest_id: button.dataset.claimAnyone,
            child_id: selectedChild.id,
            quantity: this.claimQuantity(quest),
          });
          await this.renderKitchen(selectedChild.id);
        });
      });
    });
    content.querySelectorAll("[data-claim-global-task]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!selectedChild) {
          this.setNotice("Add a player before claiming global missions.", true);
          return;
        }
        await this.runAction("Mission task claimed.", async () => {
          await this._hass.callService("chore_quest", "claim_global_task", {
            mission_id: button.dataset.missionId,
            task_id: button.dataset.taskId,
            child_id: selectedChild.id,
          });
          await this.renderKitchen(selectedChild.id);
        });
      });
    });
    this.bindInfoButtons(content);
  }

  async renderStore(selectedChildId) {
    await this.refresh();
    const content = this.querySelector("#content");
    const child = this.me.child || this.data.children.find((item) => item.id === selectedChildId) || this.data.children[0];
    const xp = child ? Number(this.data.xp_totals[child.id] || 0) : 0;
    const items = (this.data.store_items || []).filter((item) => item.enabled !== false);
    const rewards = items.filter((item) => (item.type || "item") !== "goal");
    const goals = items.filter((item) => item.type === "goal");

    content.innerHTML = `
      <div class="quest-theme quest-board">
        <div class="quest-giver">
          <div class="quest-giver-badge"><ha-icon icon="mdi:storefront"></ha-icon></div>
          <div>
            <h2>XP store</h2>
            <p class="muted">Spend XP on rewards, or help fund a shared goal with the rest of the house team.</p>
          </div>
        </div>
        ${this.me.child ? "" : `
          <h2 class="section-title">Choose player</h2>
          <div class="player-filter">
            ${this.data.children.map((player) => `
              <button class="secondary ${child && child.id === player.id ? "active" : ""}" data-store-select-child="${this.escapeHtml(player.id)}">
                ${this.escapeHtml(player.name)}
              </button>
            `).join("")}
          </div>
        `}
        <div class="hero">
          <div class="hero-main">
            <div class="avatar-row">
              ${child ? this.avatarHtml(child) : ""}
              <div>
                <span class="pill">Spendable XP</span>
                <h2>${child ? this.escapeHtml(child.name) : "No player selected"}</h2>
              </div>
            </div>
            <p class="muted">XP spent here is removed from the player balance and added to the activity log.</p>
          </div>
          <div class="card hero-side">
            <span class="pill">Store balance</span>
            <h2>${xp} XP</h2>
            <p class="muted">${items.length} store rewards available</p>
          </div>
        </div>
        <div class="store-layout">
          <div class="store-main">
            <h2 class="section-title">Rewards</h2>
            <div class="store-grid">
              ${rewards.length ? rewards.map((item) => this.storeItemCard(item, child, xp)).join("") : `<div class="card empty-state"><p class="muted">The reward shelf is empty right now.</p></div>`}
            </div>
            <h2 class="section-title">Shared goals</h2>
            <div class="store-grid">
              ${goals.length ? goals.map((item) => this.storeItemCard(item, child, xp)).join("") : `<div class="card empty-state"><p class="muted">No shared goals are open right now.</p></div>`}
            </div>
          </div>
          ${this.storeTokenRail(child)}
        </div>
      </div>
    `;

    content.querySelectorAll("[data-store-select-child]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.renderStore(button.dataset.storeSelectChild);
      });
    });
    content.querySelectorAll("[data-buy-store-item]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!child) {
          this.setNotice("Choose a player before spending XP.", true);
          return;
        }
        const item = this.data.store_items.find((entry) => entry.id === button.dataset.buyStoreItem);
        const amount = item?.type === "goal" ? this.storeContributionAmount(item, xp) : undefined;
        await this.runAction(item?.type === "goal" ? "XP contributed to goal." : "Store reward bought.", async () => {
          await this._hass.callService("chore_quest", "spend_xp", {
            item_id: button.dataset.buyStoreItem,
            child_id: child.id,
            amount,
          });
          await this.renderStore(child.id);
        });
      });
    });
    content.querySelectorAll("[data-cash-token]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", async () => {
        await this.runAction("Reward token cashed in.", async () => {
          await this._hass.callService("chore_quest", "cash_in_store_token", {
            token_id: button.dataset.cashToken,
          });
          await this.renderStore(child && child.id);
        });
      });
    });
  }

  async renderTokens(selectedChildId) {
    await this.refresh();
    const content = this.querySelector("#content");
    const selectedChild = this.me.child || this.data.children.find((item) => item.id === selectedChildId) || this.data.children[0];
    const canPickPlayer = !this.me.child;
    const tokens = (this.data.store_tokens || [])
      .filter((token) => !selectedChild || token.child_id === selectedChild.id)
      .filter((token) => token.status !== "orphaned");

    content.innerHTML = `
      <div class="quest-theme quest-board">
        <div class="quest-giver">
          <div class="quest-giver-badge"><ha-icon icon="mdi:ticket-confirmation"></ha-icon></div>
          <div>
            <h2>Reward tokens</h2>
            <p class="muted">Purchased rewards live here until a grown-up cashes them in.</p>
          </div>
        </div>
        ${canPickPlayer ? `
          <h2 class="section-title">Choose player</h2>
          <div class="player-filter">
            ${this.data.children.map((child) => `
              <button class="secondary ${selectedChild && selectedChild.id === child.id ? "active" : ""}" data-token-select-child="${this.escapeHtml(child.id)}">
                ${this.escapeHtml(child.name)}
              </button>
            `).join("")}
          </div>
        ` : ""}
        <h2 class="section-title">${selectedChild ? this.escapeHtml(selectedChild.name) : "All"} tokens</h2>
        <div class="store-grid">
          ${tokens.length ? tokens.map((token) => this.storeTokenCard(token)).join("") : `<div class="card empty-state"><p class="muted">No reward tokens yet.</p></div>`}
        </div>
      </div>
    `;

    content.querySelectorAll("[data-token-select-child]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.renderTokens(button.dataset.tokenSelectChild);
      });
    });
    content.querySelectorAll("[data-cash-token]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", async () => {
        await this.runAction("Reward token cashed in.", async () => {
          await this._hass.callService("chore_quest", "cash_in_store_token", {
            token_id: button.dataset.cashToken,
          });
          await this.renderTokens(selectedChild && selectedChild.id);
        });
      });
    });
  }

  bindInfoButtons(content) {
    content.querySelectorAll("[data-info]").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = content.querySelector(`[data-info-panel="${CSS.escape(button.dataset.info)}"]`);
        if (panel) {
          panel.style.display = panel.style.display === "none" ? "block" : "none";
        }
      });
    });
  }

  kitchenChildCard(child, selected) {
    const total = Number(this.data.weekly_totals[child.id] || 0);
    const spendableXp = Number(this.data.xp_totals[child.id] || 0);
    const lifetimeXp = Number(this.data.xp_lifetime_totals[child.id] ?? spendableXp);
    const rank = this.rankForXp(lifetimeXp);
    const goal = Number(child.goal || 10);
    const pct = Math.min(100, Math.round((total / goal) * 100));
    return `
      <div class="card house-card">
        <div class="avatar-row">
          ${this.avatarHtml(child)}
          <div class="avatar-copy">
            <span class="pill">${selected ? "Chosen player" : "Player"}</span>
            <h2>${this.escapeHtml(child.name)}</h2>
          </div>
        </div>
        <div class="money"><div style="width:${pct}%"></div></div>
        <strong>GBP ${total.toFixed(2)} this week</strong>
        ${this.rankBadge(rank, lifetimeXp)}
        <div class="muted">${spendableXp} spendable XP</div>
        <div style="margin-top:12px">
          <button class="${selected ? "" : "secondary"}" data-select-child="${this.escapeHtml(child.id)}">${selected ? "Selected" : "Choose"}</button>
        </div>
      </div>
    `;
  }

  activeGlobalMissions() {
    return (this.data.global_missions || []).filter((mission) => mission.enabled !== false && !mission.done);
  }

  globalMissionCard(mission, selectedChild) {
    return `
      <div class="card quest-card">
        <div class="quest-top">
          <ha-icon icon="${this.escapeHtml(mission.icon || "mdi:rocket-launch")}"></ha-icon>
        </div>
        <div class="quest-copy">
          <h3>${this.escapeHtml(mission.name)}</h3>
          <div class="badge-list">${this.badgePills(mission.badges || ["team"])}</div>
          <p class="muted">${this.escapeHtml(mission.description || "Complete this house mission so the next thing can happen.")}</p>
          <div class="mission-task-grid">
            ${(mission.tasks || []).map((task) => this.globalMissionTaskRow(mission, task, selectedChild)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  globalMissionTaskRow(mission, task, selectedChild) {
    const status = task.status || "open";
    const reward = Number(task.reward || 0);
    const xp = Number(task.xp || 0);
    const claimedName = task.claimed_child_id ? this.childName(task.claimed_child_id) : "";
    const meta = `${xp} XP${reward ? ` - GBP ${reward.toFixed(2)}` : ""}${task.approval_required ? " - approval" : ""}`;
    if (status === "approved") {
      return `
        <div class="mission-task-tile is-complete">
          <div>
            <h4>[done] ${this.escapeHtml(task.name)}</h4>
            <span class="pill">${this.escapeHtml(meta)}</span>
            ${claimedName ? `<p class="muted">Completed by ${this.escapeHtml(claimedName)}</p>` : ""}
          </div>
        </div>
      `;
    }
    if (status === "pending") {
      return `
        <div class="mission-task-tile is-pending">
          <div>
            <h4>${this.escapeHtml(task.name)}</h4>
            <span class="pill">${this.escapeHtml(meta)}</span>
            <p class="muted">Waiting for approval${claimedName ? ` - ${this.escapeHtml(claimedName)}` : ""}</p>
          </div>
        </div>
      `;
    }
    return `
      <div class="mission-task-tile">
        <div>
          <h4>${this.escapeHtml(task.name)}</h4>
          <span class="pill">${this.escapeHtml(meta)}</span>
          ${task.description ? `<div class="muted">${this.escapeHtml(task.description)}</div>` : ""}
        </div>
        <button data-claim-global-task data-mission-id="${this.escapeHtml(mission.id)}" data-task-id="${this.escapeHtml(task.id)}">
          ${selectedChild ? `Claim for ${this.escapeHtml(selectedChild.name)}` : "Add a player first"}
        </button>
      </div>
    `;
  }

  dashboardStats() {
    const now = new Date();
    const weekStart = new Date(now);
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - day);
    const year = now.getFullYear();

    const approved = (this.data.history || []).filter((event) =>
      ["approved", "anyone_approved", "global_task_approved", "global_task_completed"].includes(event.type)
    );
    const approvedThisYear = approved.filter((event) => {
      const created = new Date(event.created_at);
      return !Number.isNaN(created.getTime()) && created.getFullYear() === year;
    });
    const approvedThisWeek = approvedThisYear.filter((event) => new Date(event.created_at) >= weekStart);
    const totalWeek = Object.values(this.data.weekly_totals || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    const totalYear = approvedThisYear.reduce((sum, event) => sum + Number(event.reward || 0), 0);
    const top = (this.data.children || []).reduce(
      (best, child) => {
        const total = Number((this.data.weekly_totals || {})[child.id] || 0);
        return total > best.total ? { child, total } : best;
      },
      { child: null, total: 0 },
    );

    return {
      totalWeek,
      totalYear,
      completedWeek: approvedThisWeek.length,
      completedYear: approvedThisYear.length,
      pendingCount: Object.keys(this.data.claims || {}).length
        + Object.keys(this.data.anyone_claims || {}).length
        + this.activeGlobalMissions().reduce(
          (count, mission) => count + (mission.tasks || []).filter((task) => task.status === "pending").length,
          0,
        ),
      topChildName: top.child ? top.child.name : "No leader yet",
      topChildTotal: top.total,
    };
  }

  statCard(label, value, hint) {
    return `
      <div class="card stat">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
        <span>${this.escapeHtml(hint)}</span>
      </div>
    `;
  }

  claimQuantity(chore) {
    if (!chore.quantity_enabled) {
      return 1;
    }
    const label = chore.quantity_label || "How many?";
    const value = window.prompt(label, "1");
    if (value === null) {
      throw new Error("Quest cancelled.");
    }
    const quantity = Math.max(1, Math.min(100, Math.floor(Number(value || 1))));
    if (!Number.isFinite(quantity)) {
      throw new Error("Please enter a number.");
    }
    return quantity;
  }

  kidChoreCard(chore) {
    const pending = this.claimState(chore.id) === "pending";
    const blocksOnPending = chore.repeat_mode !== "unlimited";
    const description = chore.description || "No extra instructions for this quest yet.";
    return `
      <div class="card quest-card">
        <div class="quest-top">
          <ha-icon icon="${this.escapeHtml(chore.icon || "mdi:clipboard-check")}"></ha-icon>
          <button class="secondary icon-button" title="Task details" data-info="${this.escapeHtml(chore.id)}">?</button>
        </div>
        <div class="quest-copy">
          <h3>${this.escapeHtml(chore.name)}</h3>
          <span class="pill">${this.escapeHtml(this.scheduleLabel(chore.schedule))} - GBP ${Number(chore.reward).toFixed(2)}</span>
          <div class="badge-list">${this.badgePills(chore.badges || [])}</div>
          <span class="pill">${Number(chore.xp || 0)} XP</span>
          <p class="muted" data-info-panel="${this.escapeHtml(chore.id)}" style="display:none">${this.escapeHtml(description)}</p>
        </div>
        <button ${pending && blocksOnPending ? "disabled" : ""} data-claim="${this.escapeHtml(chore.id)}">
          ${pending && blocksOnPending ? "Waiting for approval" : "I did it"}
        </button>
      </div>
    `;
  }

  anyoneQuestCard(quest, selectedChild) {
    const pending = this.anyoneClaimState(quest.id) === "pending";
    const blocksOnPending = quest.repeat_mode !== "unlimited";
    const description = quest.description || "This is open to anyone in the house.";
    return `
      <div class="card quest-card">
        <div class="quest-top">
          <ha-icon icon="${this.escapeHtml(quest.icon || "mdi:account-group")}"></ha-icon>
          <button class="secondary icon-button" title="Quest details" data-info="${this.escapeHtml(`anyone_${quest.id}`)}">?</button>
        </div>
        <div class="quest-copy">
          <h3>${this.escapeHtml(quest.name)}</h3>
          <span class="pill">Anyone - ${this.escapeHtml(this.scheduleLabel(quest.schedule))} - GBP ${Number(quest.reward).toFixed(2)}</span>
          <div class="badge-list">${this.badgePills(quest.badges || ["team"])}</div>
          <span class="pill">${Number(quest.xp || 0)} XP</span>
          <p class="muted" data-info-panel="${this.escapeHtml(`anyone_${quest.id}`)}" style="display:none">${this.escapeHtml(description)}</p>
        </div>
        <button ${(!selectedChild || (pending && blocksOnPending)) ? "disabled" : ""} data-claim-anyone="${this.escapeHtml(quest.id)}">
          ${!selectedChild ? "Choose a player first" : pending && blocksOnPending ? "Waiting for approval" : `Claim for ${this.escapeHtml(selectedChild.name)}`}
        </button>
      </div>
    `;
  }

  storeItemCard(item, child, xp) {
    const price = Number(item.price || 0);
    const isGoal = item.type === "goal";
    const contributed = this.storeGoalContributed(item);
    const remaining = Math.max(0, price - contributed);
    const complete = isGoal && remaining <= 0;
    const canSpend = child && price > 0 && xp >= (isGoal ? Math.min(remaining || price, xp) : price) && !complete;
    const image = item.image_url
      ? `<img class="store-image" src="${this.escapeHtml(item.image_url)}" alt="${this.escapeHtml(item.title)}">`
      : `<div class="store-icon-fallback"><ha-icon icon="${this.escapeHtml(item.icon || "mdi:gift")}"></ha-icon></div>`;
    const progress = price ? Math.min(100, Math.round((contributed / price) * 100)) : 0;
    return `
      <div class="card quest-card store-card">
        ${image}
        <div class="quest-copy">
          <div class="badge-list">
            <span class="mission-badge">${isGoal ? "Shared Goal" : "Reward"}</span>
            <span class="pill">${price} XP</span>
          </div>
          <h3>${this.escapeHtml(item.title)}</h3>
          ${item.description ? `<p class="muted">${this.escapeHtml(item.description)}</p>` : ""}
          ${isGoal ? `
            <div class="money"><div style="width:${progress}%"></div></div>
            <strong>${contributed} / ${price} XP funded</strong>
          ` : ""}
        </div>
        <button ${canSpend ? "" : "disabled"} data-buy-store-item="${this.escapeHtml(item.id)}">
          ${complete ? "Funded" : isGoal ? "Contribute" : "Buy token"}
        </button>
      </div>
    `;
  }

  storeTokenCard(token) {
    const item = (this.data.store_items || []).find((entry) => entry.id === token.item_id) || {};
    const isRedeemed = token.status === "redeemed";
    const created = token.purchased_at ? new Date(token.purchased_at).toLocaleDateString() : "";
    const redeemed = token.redeemed_at ? new Date(token.redeemed_at).toLocaleDateString() : "";
    const image = item.image_url
      ? `<img class="store-image" src="${this.escapeHtml(item.image_url)}" alt="${this.escapeHtml(token.item_title)}">`
      : `<div class="store-icon-fallback"><ha-icon icon="${this.escapeHtml(item.icon || "mdi:ticket-confirmation")}"></ha-icon></div>`;
    return `
      <div class="card quest-card store-card ${isRedeemed ? "mission-complete" : ""}">
        ${image}
        <div class="quest-copy">
          <div class="badge-list">
            <span class="mission-badge">${isRedeemed ? "Cashed in" : "Ready"}</span>
            <span class="pill">${Number(token.xp || 0)} XP</span>
          </div>
          <h3>${this.escapeHtml(token.item_title)}</h3>
          <p class="muted">${this.escapeHtml(this.childName(token.child_id))} bought this${created ? ` on ${created}` : ""}${redeemed ? ` - cashed in ${redeemed}` : ""}</p>
        </div>
        ${this.isAdmin() && !isRedeemed ? `<button data-cash-token="${this.escapeHtml(token.id)}">Cash in</button>` : ""}
      </div>
    `;
  }

  storeTokenRail(child) {
    const tokens = (this.data.store_tokens || [])
      .filter((token) => !child || token.child_id === child.id)
      .filter((token) => token.status !== "orphaned")
      .sort((a, b) => String(b.redeemed_at || b.purchased_at || "").localeCompare(String(a.redeemed_at || a.purchased_at || "")));
    const active = tokens.filter((token) => token.status === "active");
    const redeemed = tokens.filter((token) => token.status === "redeemed").slice(0, 8);
    return `
      <aside class="store-token-rail">
        <div>
          <span class="pill">Reward tokens</span>
          <h2>${child ? this.escapeHtml(child.name) : "Player"} rewards</h2>
          <p class="muted">Bought rewards wait here until a grown-up cashes them in.</p>
        </div>
        <div class="store-token-section">
          <h3>Ready to cash in</h3>
          <div class="token-mini-list">
            ${active.length ? active.map((token) => this.storeTokenMini(token)).join("") : `<p class="muted">No active tokens.</p>`}
          </div>
        </div>
        <div class="store-token-section">
          <h3>Cashed in</h3>
          <div class="token-mini-list">
            ${redeemed.length ? redeemed.map((token) => this.storeTokenMini(token)).join("") : `<p class="muted">Nothing cashed in yet.</p>`}
          </div>
        </div>
      </aside>
    `;
  }

  storeTokenMini(token) {
    const isRedeemed = token.status === "redeemed";
    const date = isRedeemed ? token.redeemed_at : token.purchased_at;
    const label = date ? new Date(date).toLocaleDateString() : "";
    return `
      <div class="token-mini ${isRedeemed ? "redeemed" : ""}">
        <div>
          <span class="mission-badge">${isRedeemed ? "Cashed in" : "Ready"}</span>
          <h4>${this.escapeHtml(token.item_title)}</h4>
          <p class="muted">${this.escapeHtml(this.childName(token.child_id))}${label ? ` - ${label}` : ""}</p>
        </div>
        ${this.isAdmin() && !isRedeemed ? `<button data-cash-token="${this.escapeHtml(token.id)}">Cash in</button>` : ""}
      </div>
    `;
  }

  storeGoalContributed(item) {
    return Object.values(item.contributions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  storeContributionAmount(item, availableXp) {
    const remaining = Math.max(0, Number(item.price || 0) - this.storeGoalContributed(item));
    const max = Math.min(Number(availableXp || 0), remaining);
    const value = window.prompt(`How much XP do you want to contribute? Max ${max}`, String(max));
    if (value === null) {
      throw new Error("Store contribution cancelled.");
    }
    const amount = Math.max(1, Math.min(max, Math.floor(Number(value || 0))));
    if (!Number.isFinite(amount)) {
      throw new Error("Please enter a number.");
    }
    return amount;
  }

  adminNavButton(section, label, icon, activeSection) {
    return `
      <button class="secondary ${activeSection === section ? "active" : ""}" data-admin-section="${this.escapeHtml(section)}">
        <ha-icon icon="${this.escapeHtml(icon)}"></ha-icon>
        <span>${this.escapeHtml(label)}</span>
      </button>
    `;
  }

  async renderAdmin() {
    if (!this.isAdmin()) {
      this.setNotice("Admin access requires a Home Assistant admin account.", true);
      await this.renderKid();
      return;
    }

    await this.refresh();
    await this.refreshUsers();
    const content = this.querySelector("#content");
    const pending = Object.values(this.data.claims || {});
    const anyonePending = Object.values(this.data.anyone_claims || {});
    const activeAdminSection = this.adminSection || "home";

    content.innerHTML = `
      <div class="admin-shell">
        <div class="card admin-nav">
          ${this.adminNavButton("home", "Home", "mdi:home", activeAdminSection)}
          ${this.adminNavButton("players", "Player management", "mdi:account-group", activeAdminSection)}
          ${this.adminNavButton("chores", "Personal quests", "mdi:calendar-check", activeAdminSection)}
          ${this.adminNavButton("anyone", "Anyone quests", "mdi:account-multiple-check", activeAdminSection)}
          ${this.adminNavButton("global", "Global missions", "mdi:rocket-launch", activeAdminSection)}
          ${this.adminNavButton("store", "Store", "mdi:storefront", activeAdminSection)}
          ${this.adminNavButton("money", "Pocket money", "mdi:cash-sync", activeAdminSection)}
          ${this.adminNavButton("ranks", "Ranks", "mdi:shield-star", activeAdminSection)}
          ${this.adminNavButton("notifications", "Notifications", "mdi:bell", activeAdminSection)}
          ${this.adminNavButton("logs", "Logs", "mdi:history", activeAdminSection)}
        </div>
        <div>
          <section class="admin-section ${activeAdminSection === "home" ? "active" : ""}" data-admin-panel="home">
            <div class="grid">
              ${this.data.children.map((child) => this.childCard(child)).join("")}
            </div>
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:check-decagram"></ha-icon>Pending approvals</h2>
              ${pending.length || anyonePending.length || this.globalPendingTaskRows() ? "" : `<p class="muted">No quests waiting for approval.</p>`}
              ${pending.map((claim) => this.pendingRow(claim)).join("")}
              ${anyonePending.map((claim) => this.anyonePendingRow(claim)).join("")}
              ${this.globalPendingTaskRows()}
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "players" ? "active" : ""}" data-admin-panel="players">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:account-child"></ha-icon>Children</h2>
              <form id="child-form">
                <label>Name<input name="name" required placeholder="Alex"></label>
                <label>Home Assistant user
                  <select name="user_ids">
                    <option value="">No user linked yet</option>
                    ${this.users.map((user) => `<option value="${this.escapeHtml(user.id)}">${this.escapeHtml(user.name || user.id)}${user.is_admin ? " (admin)" : ""}</option>`).join("")}
                  </select>
                </label>
                <label>Weekly goal<input name="goal" type="number" min="0" step="0.5" value="10"></label>
                <button type="submit">Save child</button>
              </form>
              <div style="margin-top:12px">
                ${this.data.children.map((child) => this.childAdminRow(child)).join("")}
              </div>
            </div>
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:view-dashboard"></ha-icon>Dashboard User Views</h2>
              <p class="muted">Create shared dashboard profiles for tablets or room accounts. Only saved dashboard users appear below.</p>
              <form id="kitchen-form">
                <label>Friendly name<input name="name" required placeholder="Kitchen tablet"></label>
                <label>Home Assistant user
                  <select name="user_id" required>
                    <option value="">Choose a user</option>
                    ${this.availableDashboardUsers().map((user) => `<option value="${this.escapeHtml(user.id)}">${this.escapeHtml(user.name || user.id)}${user.is_admin ? " (admin)" : ""}</option>`).join("")}
                  </select>
                </label>
                <button type="submit">Save dashboard user</button>
              </form>
              <div style="margin-top:12px">
                ${this.dashboardUserRows()}
              </div>
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "chores" ? "active" : ""}" data-admin-panel="chores">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:calendar-check"></ha-icon>Personal quests</h2>
              <p class="muted">Choose a player, then expand a task to edit its details. Use the new-task editor at the bottom to add another personal quest.</p>
              <div class="player-filter">
                ${this.chorePlayerButtons()}
              </div>
              <div class="chore-groups">
                ${this.choreEditorGroups()}
              </div>
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "anyone" ? "active" : ""}" data-admin-panel="anyone">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:account-multiple-check"></ha-icon>Anyone quests</h2>
              <p class="muted">Use these for repeatable tasks that any player can claim. The reward and XP go to whoever claims and gets approved.</p>
              <div class="chore-groups">
                ${this.anyoneQuestEditorGroups()}
              </div>
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "global" ? "active" : ""}" data-admin-panel="global">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:rocket-launch"></ha-icon>Global missions</h2>
              <p class="muted">Global missions are grouped objectives with task rows. They can be saved as templates and launched again later.</p>
              <form id="global-mission-form">
                <label>Mission objective<input name="name" required placeholder="Before screen time"></label>
                <input name="id" type="hidden">
                <label>Icon${this.iconPickerInput('name="icon"', "mdi:rocket-launch", "mdi:broom")}</label>
                <label>Badges<input name="badges" placeholder="team, mandatory" value="team"></label>
                <label>Description<input name="description" placeholder="What needs doing before the fun thing?"></label>
                <div class="task-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Task<span>What needs doing</span></th>
                        <th>Description<span>Optional helpful detail</span></th>
                        <th>XP<span>Rank points</span></th>
                        <th>Money<span>Optional GBP reward</span></th>
                        <th>Approval<span>Needs parent check?</span></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody id="global-task-rows">
                      ${this.globalTaskEditorRows([])}
                    </tbody>
                  </table>
                </div>
                <button type="button" class="secondary" id="add-global-task-row">Add task row</button>
                <button type="submit">Post mission</button>
                <button type="button" class="secondary" id="clear-global-mission-form">Clear</button>
              </form>
              <div style="margin-top:12px">
                ${this.globalMissionRows()}
              </div>
            </div>
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:content-save"></ha-icon>Saved mission templates</h2>
              ${this.globalTemplateRows()}
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "store" ? "active" : ""}" data-admin-panel="store">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:storefront"></ha-icon>Store</h2>
              <p class="muted">Create XP rewards players can buy, or shared goals that everyone can contribute XP toward.</p>
              <div class="chore-groups">
                ${this.storeEditorRows()}
              </div>
            </div>
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:ticket-confirmation"></ha-icon>Purchased tokens</h2>
              <div class="store-grid">
                ${this.adminActiveTokenCards()}
              </div>
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "money" ? "active" : ""}" data-admin-panel="money">
            <div class="grid">
              ${this.data.children.map((child) => this.childCard(child)).join("")}
            </div>
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:cash-sync"></ha-icon>Pocket money and XP</h2>
              <p class="muted">Choose a player, then add or subtract pocket money or XP with a note for the activity log.</p>
              ${this.data.children.length ? `
                <div class="player-filter">
                  ${this.moneyPlayerButtons()}
                </div>
                ${this.moneyAdjustmentPanel()}
              ` : `<p class="muted">Add a child before adjusting balances.</p>`}
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "ranks" ? "active" : ""}" data-admin-panel="ranks">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:shield-star"></ha-icon>Ranks</h2>
              <p class="muted">Set the SideQuest rank ladder. Players receive the highest rank where their total XP is at least the XP value.</p>
              <div class="task-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank<span>Name shown on player cards</span></th>
                      <th>XP<span>Minimum XP needed</span></th>
                      <th>Icon<span>Material Design icon name</span></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="rank-rows">
                    ${this.rankEditorRows()}
                  </tbody>
                </table>
              </div>
              <button type="button" class="secondary" id="add-rank-row">Add rank</button>
              <button type="button" id="save-ranks">Save ranks</button>
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "notifications" ? "active" : ""}" data-admin-panel="notifications">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:bell"></ha-icon>Notifications</h2>
              <p class="muted">Add the phones or devices that should receive approval requests. Leave the table empty to disable notifications.</p>
              <div class="task-table">
                <table>
                  <thead>
                    <tr>
                      <th>Notification device name<span>Friendly name shown here</span></th>
                      <th>Linked device<span>Home Assistant notify service</span></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="notification-rows">
                    ${this.notificationTargetRows()}
                  </tbody>
                </table>
              </div>
              <button type="button" class="secondary" id="add-notification-row">Add notification device</button>
              <button type="button" id="save-notifications">Save notifications</button>
            </div>
          </section>

          <section class="admin-section ${activeAdminSection === "logs" ? "active" : ""}" data-admin-panel="logs">
            <div class="card admin-panel">
              <h2><ha-icon icon="mdi:history"></ha-icon>Recent activity</h2>
              ${this.data.history.length ? this.data.history.slice(0, 50).map((event) => this.historyRow(event)).join("") : `<p class="muted">No activity yet.</p>`}
            </div>
          </section>
        </div>
      </div>
    `;

    content.querySelectorAll("[data-admin-section]").forEach((button) => {
      button.addEventListener("click", async () => {
        this.adminSection = button.dataset.adminSection;
        await this.renderAdmin();
      });
    });

    content.querySelectorAll("[data-chore-player]").forEach((button) => {
      button.addEventListener("click", async () => {
        this.selectedChoreChildId = button.dataset.chorePlayer;
        this.expandedChoreId = "";
        await this.renderAdmin();
      });
    });

    content.querySelectorAll("[data-toggle-chore-editor]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.toggleChoreEditor;
        this.expandedChoreId = this.expandedChoreId === id ? "" : id;
        await this.renderAdmin();
      });
    });

    content.querySelectorAll("[data-toggle-anyone-editor]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.toggleAnyoneEditor;
        this.expandedAnyoneQuestId = this.expandedAnyoneQuestId === id ? "" : id;
        await this.renderAdmin();
      });
    });

    content.querySelectorAll("[data-toggle-store-editor]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.toggleStoreEditor;
        this.expandedStoreItemId = this.expandedStoreItemId === id ? "" : id;
        await this.renderAdmin();
      });
    });

    content.querySelector("#child-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.runAction("Child saved.", async () => {
        const form = new FormData(event.currentTarget);
        await this._hass.callService("chore_quest", "add_child", {
          name: form.get("name"),
          user_ids: form.get("user_ids"),
          goal: Number(form.get("goal")),
        });
        await this.renderAdmin();
      });
    });

    content.querySelector("#kitchen-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.runAction("Dashboard user saved.", async () => {
        const form = new FormData(event.currentTarget);
        const userId = form.get("user_id");
        const dashboardUsers = this.dashboardUsers()
          .filter((item) => item.user_id !== userId)
          .concat([{ user_id: userId, name: form.get("name") }]);
        await this._hass.callWS({
          type: "chore_quest/update_settings",
          dashboard_users: dashboardUsers,
        });
        await this.renderAdmin();
      });
    });

    content.querySelector("#global-mission-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.runAction("House mission posted.", async () => {
        const form = new FormData(event.currentTarget);
        await this._hass.callService("chore_quest", "upsert_global_mission", {
          id: form.get("id") || undefined,
          name: form.get("name"),
          icon: form.get("icon") || "mdi:rocket-launch",
          badges: form.get("badges") || "team",
          xp: 0,
          description: form.get("description") || "",
          tasks: this.readGlobalTaskRows(content),
          enabled: true,
          done: false,
        });
        await this.renderAdmin();
      });
    });

    content.querySelectorAll("[data-money-player]").forEach((button) => {
      button.addEventListener("click", async () => {
        this.selectedMoneyChildId = button.dataset.moneyPlayer;
        await this.renderAdmin();
      });
    });

    this.bindAdjustmentPreview(content);

    content.querySelector("#money-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.runAction("Pocket money adjusted.", async () => {
        const form = new FormData(event.currentTarget);
        const sign = form.get("direction") === "subtract" ? -1 : 1;
        await this._hass.callService("chore_quest", "adjust_money", {
          child_id: form.get("child_id"),
          amount: sign * Number(form.get("amount")),
          note: form.get("note"),
        });
        await this.renderAdmin();
      });
    });

    content.querySelector("#xp-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.runAction("XP adjusted.", async () => {
        const form = new FormData(event.currentTarget);
        const sign = form.get("direction") === "subtract" ? -1 : 1;
        await this._hass.callService("chore_quest", "adjust_xp", {
          child_id: form.get("child_id"),
          amount: sign * Number(form.get("amount")),
          note: form.get("note"),
        });
        await this.renderAdmin();
      });
    });

    content.querySelectorAll("[data-save-chore-row]").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest(".chore-editor");
        const chore = this.readChoreRow(row);
        if (!chore.name || !chore.child_id) {
          this.setNotice("Chore rows need at least a name and player.", true);
          return;
        }
        await this.runAction("Personal quest saved.", async () => {
          await this._hass.callService("chore_quest", "upsert_chore", chore);
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-save-anyone-row]").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest(".chore-editor");
        const quest = this.readAnyoneQuestRow(row);
        if (!quest.name) {
          this.setNotice("Anyone quest rows need at least a name.", true);
          return;
        }
        await this.runAction("Anyone quest saved.", async () => {
          await this._hass.callService("chore_quest", "upsert_anyone_quest", quest);
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-save-store-row]").forEach((button) => {
      button.addEventListener("click", async () => {
        const row = button.closest(".chore-editor");
        const item = this.readStoreRow(row);
        if (!item.title) {
          this.setNotice("Store items need a title.", true);
          return;
        }
        await this.runAction("Store item saved.", async () => {
          await this._hass.callService("chore_quest", "upsert_store_item", item);
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-approve]").forEach((button) => {
      button.addEventListener("click", async () => {
        const rating = Number(button.dataset.rating || 5);
        await this.runAction("Mission approved.", async () => {
          await this._hass.callService("chore_quest", "approve_chore", {
            chore_id: button.dataset.approve,
            rating,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-deny]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Personal quest denied.", async () => {
          await this._hass.callService("chore_quest", "deny_chore", { chore_id: button.dataset.deny });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-approve-anyone]").forEach((button) => {
      button.addEventListener("click", async () => {
        const rating = Number(button.dataset.rating || 5);
        await this.runAction("Shared quest approved.", async () => {
          await this._hass.callService("chore_quest", "approve_anyone_quest", {
            quest_id: button.dataset.approveAnyone,
            rating,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-deny-anyone]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Shared quest denied.", async () => {
          await this._hass.callService("chore_quest", "deny_anyone_quest", {
            quest_id: button.dataset.denyAnyone,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-approve-global-task]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Mission task approved.", async () => {
          await this._hass.callService("chore_quest", "approve_global_task", {
            mission_id: button.dataset.missionId,
            task_id: button.dataset.taskId,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-deny-global-task]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Mission task denied.", async () => {
          await this._hass.callService("chore_quest", "deny_global_task", {
            mission_id: button.dataset.missionId,
            task_id: button.dataset.taskId,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelector("#clear-global-mission-form").addEventListener("click", () => {
      this.clearGlobalMissionForm(content.querySelector("#global-mission-form"));
    });

    content.querySelector("#add-global-task-row").addEventListener("click", () => {
      this.addGlobalTaskRow(content);
    });

    this.bindGlobalTaskRowButtons(content);
    this.bindRankRowButtons(content);
    this.bindIconPickers(content);

    content.querySelector("#add-rank-row")?.addEventListener("click", () => {
      this.addRankRow(content);
    });

    content.querySelector("#save-ranks")?.addEventListener("click", async () => {
      await this.runAction("Ranks saved.", async () => {
        await this._hass.callWS({
          type: "chore_quest/update_settings",
          ranks: this.readRankRows(content),
        });
        await this.renderAdmin();
      });
    });

    content.querySelector("#save-notifications")?.addEventListener("click", async () => {
      await this.runAction("Notification targets saved.", async () => {
        await this._hass.callWS({
          type: "chore_quest/update_settings",
          notify_targets: this.readNotificationTargets(content),
        });
        await this.renderAdmin();
      });
    });

    content.querySelector("#add-notification-row")?.addEventListener("click", () => {
      this.addNotificationRow(content);
    });

    this.bindNotificationRowButtons(content);

    content.querySelectorAll("[data-delete-chore-row]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Personal quest deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_chore", { chore_id: button.dataset.deleteChoreRow });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-delete-anyone-row]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Anyone quest deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_anyone_quest", {
            quest_id: button.dataset.deleteAnyoneRow,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-delete-store-row]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Store item deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_store_item", {
            item_id: button.dataset.deleteStoreRow,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-cash-token]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", async () => {
        await this.runAction("Reward token cashed in.", async () => {
          await this._hass.callService("chore_quest", "cash_in_store_token", {
            token_id: button.dataset.cashToken,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-edit-global]").forEach((button) => {
      button.addEventListener("click", () => {
        const mission = this.data.global_missions.find((item) => item.id === button.dataset.editGlobal);
        if (mission) this.fillGlobalMissionForm(content.querySelector("#global-mission-form"), mission);
      });
    });

    content.querySelectorAll("[data-delete-global]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("House mission deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_global_mission", { mission_id: button.dataset.deleteGlobal });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-save-global-template]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Mission template saved.", async () => {
          await this._hass.callService("chore_quest", "save_global_mission_template", {
            mission_id: button.dataset.saveGlobalTemplate,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-launch-global-template]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Saved mission launched.", async () => {
          await this._hass.callService("chore_quest", "launch_global_mission_template", {
            template_id: button.dataset.launchGlobalTemplate,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-delete-global-template]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Saved mission template deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_global_mission_template", {
            template_id: button.dataset.deleteGlobalTemplate,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-delete-child]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Child deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_child", { child_id: button.dataset.deleteChild });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-delete-dashboard-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Dashboard user deleted.", async () => {
          const dashboardUsers = this.dashboardUsers().filter((item) => item.user_id !== button.dataset.deleteDashboardUser);
          await this._hass.callWS({
            type: "chore_quest/update_settings",
            dashboard_users: dashboardUsers,
          });
          await this.renderAdmin();
        });
      });
    });

    content.querySelectorAll("[data-delete-history]").forEach((button) => {
      button.addEventListener("click", async () => {
        await this.runAction("Activity deleted.", async () => {
          await this._hass.callService("chore_quest", "delete_history_event", { event_id: button.dataset.deleteHistory });
          await this.renderAdmin();
        });
      });
    });
  }

  scheduleFromValue(value) {
    if (value === "none") return { type: "none" };
    if (value === "weekdays") return { type: "days", days: [0, 1, 2, 3, 4] };
    if (value === "weekend") return { type: "days", days: [5, 6] };
    return { type: "daily" };
  }

  childCard(child) {
    const total = Number(this.data.weekly_totals[child.id] || 0);
    const spendableXp = Number(this.data.xp_totals[child.id] || 0);
    const lifetimeXp = Number(this.data.xp_lifetime_totals[child.id] ?? spendableXp);
    const goal = Number(child.goal || 10);
    const pct = Math.min(100, Math.round((total / goal) * 100));
    return `
      <div class="card">
        <div class="avatar-row">
          ${this.avatarHtml(child)}
          <h2>${this.escapeHtml(child.name)}</h2>
        </div>
        <div class="money"><div style="width:${pct}%"></div></div>
        <strong>GBP ${total.toFixed(2)} this week</strong>
        <div class="rank-badge">
          <ha-icon icon="mdi:star-shooting"></ha-icon>
          <span>${lifetimeXp} rank XP</span>
        </div>
        <div class="muted">${spendableXp} spendable XP</div>
      </div>
    `;
  }

  selectedMoneyChild() {
    const children = this.data.children || [];
    if (!children.length) return null;
    return children.find((child) => child.id === this.selectedMoneyChildId) || children[0];
  }

  moneyPlayerButtons() {
    const selected = this.selectedMoneyChild();
    return (this.data.children || [])
      .map((child) => `
        <button class="secondary ${selected && selected.id === child.id ? "active" : ""}" data-money-player="${this.escapeHtml(child.id)}">
          ${this.escapeHtml(child.name)}
        </button>
      `)
      .join("");
  }

  moneyAdjustmentPanel() {
    const child = this.selectedMoneyChild();
    if (!child) return "";
    const money = Number(this.data.weekly_totals[child.id] || 0);
    const xp = Number(this.data.xp_totals[child.id] || 0);
    const lifetimeXp = Number(this.data.xp_lifetime_totals[child.id] ?? xp);
    return `
      <div class="grid">
        ${this.adjustmentForm({
          id: "money-form",
          child,
          title: "Pocket money",
          icon: "mdi:cash-sync",
          current: money,
          unit: "GBP",
          step: "0.1",
          defaultAmount: "0.5",
          amountLabel: "Amount",
          notePlaceholder: "Spent on sweets, bonus for helping",
        })}
        ${this.adjustmentForm({
          id: "xp-form",
          child,
          title: "Spendable XP",
          icon: "mdi:star-shooting",
          current: xp,
          unit: "XP",
          step: "1",
          defaultAmount: "10",
          amountLabel: "XP amount",
          notePlaceholder: "Bonus XP, correction, store refund",
        })}
      </div>
      <div class="card admin-panel">
        <h2><ha-icon icon="mdi:history"></ha-icon>${this.escapeHtml(child.name)} ledger</h2>
        <p class="muted">Rank XP: ${lifetimeXp} / Spendable XP: ${xp}</p>
        ${this.childBalanceLog(child.id)}
      </div>
    `;
  }

  adjustmentForm(config) {
    return `
      <form id="${this.escapeHtml(config.id)}" class="adjustment-box" data-adjustment-form data-current="${Number(config.current || 0)}" data-unit="${this.escapeHtml(config.unit)}">
        <input type="hidden" name="child_id" value="${this.escapeHtml(config.child.id)}">
        <h2><ha-icon icon="${this.escapeHtml(config.icon)}"></ha-icon>${this.escapeHtml(config.title)}</h2>
        <label>Current amount
          <input data-current-display readonly value="${this.formatBalance(config.current, config.unit)}">
        </label>
        <label>Change
          <select name="direction" data-adjust-direction>
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
          </select>
        </label>
        <label>${this.escapeHtml(config.amountLabel)}
          <input name="amount" data-adjust-amount type="number" min="0" step="${this.escapeHtml(config.step)}" value="${this.escapeHtml(config.defaultAmount)}">
        </label>
        <label>New amount
          <input data-new-display readonly>
        </label>
        <label>Note
          <input name="note" required placeholder="${this.escapeHtml(config.notePlaceholder)}">
        </label>
        <button type="submit">Submit ${this.escapeHtml(config.title)} change</button>
      </form>
    `;
  }

  bindAdjustmentPreview(content) {
    content.querySelectorAll("[data-adjustment-form]").forEach((form) => {
      const update = () => {
        const current = Number(form.dataset.current || 0);
        const direction = form.querySelector("[data-adjust-direction]")?.value || "add";
        const amount = Number(form.querySelector("[data-adjust-amount]")?.value || 0);
        const next = Math.max(0, current + (direction === "subtract" ? -amount : amount));
        const unit = form.dataset.unit || "";
        const output = form.querySelector("[data-new-display]");
        if (output) output.value = this.formatBalance(next, unit);
      };
      form.querySelectorAll("[data-adjust-direction], [data-adjust-amount]").forEach((input) => {
        input.addEventListener("input", update);
        input.addEventListener("change", update);
      });
      update();
    });
  }

  formatBalance(value, unit) {
    const amount = Number(value || 0);
    if (unit === "GBP") return `GBP ${amount.toFixed(2)}`;
    if (unit === "XP") return `${Math.round(amount)} XP`;
    return String(amount);
  }

  childBalanceLog(childId) {
    const relevant = (this.data.history || [])
      .filter((event) => event.child_id === childId)
      .filter((event) =>
        Number(event.reward || 0)
        || Number(event.xp || 0)
        || ["money_adjustment", "xp_adjustment", "store_purchase", "store_goal_contribution"].includes(event.type)
      )
      .slice(0, 10);
    if (!relevant.length) return `<p class="muted">No balance activity yet.</p>`;
    return relevant.map((event) => this.balanceLogRow(event)).join("");
  }

  balanceLogRow(event) {
    const created = event.created_at ? new Date(event.created_at).toLocaleString() : "";
    const reward = Number(event.reward || 0);
    const xp = Number(event.xp || 0);
    const rewardText = reward ? `GBP ${reward.toFixed(2)}` : "";
    const xpText = xp ? `${xp > 0 ? "+" : ""}${xp} XP` : "";
    const bits = [rewardText, xpText].filter(Boolean).join(" / ") || "No balance change";
    return `
      <div class="row">
        <div>
          <strong>${this.escapeHtml(event.chore_name || event.quest_name || event.type)}</strong>
          <div class="muted">${this.escapeHtml(event.type)} - ${this.escapeHtml(bits)} - ${this.escapeHtml(created)}</div>
          ${event.note ? `<div class="muted">${this.escapeHtml(event.note)}</div>` : ""}
        </div>
      </div>
    `;
  }

  childAdminRow(child) {
    return `
      <div class="row">
        <div>
          <strong>${this.escapeHtml(child.name)}</strong>
          <div class="muted">Goal GBP ${Number(child.goal || 10).toFixed(2)} - ${this.escapeHtml((child.user_ids || []).join(", ") || "No user linked")}</div>
        </div>
        <button class="danger" data-delete-child="${this.escapeHtml(child.id)}">Delete child</button>
      </div>
    `;
  }

  dashboardUsers() {
    const settings = this.data.settings || {};
    if (Array.isArray(settings.dashboard_users) && settings.dashboard_users.length) {
      return settings.dashboard_users;
    }
    return (settings.kitchen_user_ids || []).map((userId) => ({
      user_id: userId,
      name: this.userName(userId) || "Dashboard",
    }));
  }

  availableDashboardUsers() {
    const selected = new Set(this.dashboardUsers().map((item) => item.user_id));
    return (this.users || []).filter((user) => !selected.has(user.id));
  }

  userName(userId) {
    const user = (this.users || []).find((item) => item.id === userId);
    return user ? user.name || user.id : userId;
  }

  dashboardUserRows() {
    const dashboardUsers = this.dashboardUsers();
    if (!dashboardUsers.length) {
      return `<p class="muted">No dashboard users have been added yet.</p>`;
    }
    return dashboardUsers
      .map((item) => {
        const userLabel = this.userName(item.user_id);
        return `
          <div class="row">
            <div>
              <strong>${this.escapeHtml(item.name || userLabel)}</strong>
              <div class="muted">${this.escapeHtml(userLabel)} - ${this.escapeHtml(item.user_id)}</div>
            </div>
            <button class="danger" data-delete-dashboard-user="${this.escapeHtml(item.user_id)}">Delete dashboard user</button>
          </div>
        `;
      })
      .join("");
  }

  notificationTargets() {
    const settings = this.data.settings || {};
    const targets = Array.isArray(settings.notify_targets) ? settings.notify_targets : this.data.notify_targets || [];
    return targets
      .map((item) => {
        if (typeof item === "string") {
          return { name: item, target: item };
        }
        return {
          name: String(item.name || item.target || "").trim(),
          target: String(item.target || "").trim(),
        };
      })
      .filter((item) => item.target);
  }

  notificationTargetValues() {
    return this.notificationTargets().map((item) => item.target);
  }

  notificationDeviceOptions(selectedTarget) {
    const services = this.availableNotifyServices();
    const selected = selectedTarget && !services.includes(selectedTarget) ? [selectedTarget] : [];
    const options = ["", ...selected, ...services];
    return options
      .map((target) => {
        const label = target || "Choose a notify service";
        return `<option value="${this.escapeHtml(target)}" ${target === selectedTarget ? "selected" : ""}>${this.escapeHtml(label)}</option>`;
      })
      .join("");
  }

  notificationTargetRows() {
    const targets = this.notificationTargets();
    if (!targets.length) {
      return this.notificationTargetRow({}, true);
    }
    return targets.map((target) => this.notificationTargetRow(target, false)).join("");
  }

  notificationTargetRow(item = {}, isNew = false) {
    return `
      <tr data-notification-row>
        <td><input data-notification-field="name" placeholder="Ryan's phone" value="${this.escapeHtml(item.name || "")}"></td>
        <td>
          <select data-notification-field="target">
            ${this.notificationDeviceOptions(item.target || "")}
          </select>
        </td>
        <td>
          <button type="button" class="danger" data-remove-notification-row>${isNew ? "Clear" : "Delete"}</button>
        </td>
      </tr>
    `;
  }

  availableNotifyServices() {
    return this.data.notify_services || [];
  }

  addNotificationRow(content) {
    const tbody = content.querySelector("#notification-rows");
    if (!tbody) return;
    tbody.insertAdjacentHTML("beforeend", this.notificationTargetRow({}, true));
    this.bindNotificationRowButtons(content);
  }

  readNotificationTargets(content) {
    const seen = new Set();
    return Array.from(content.querySelectorAll("[data-notification-row]"))
      .map((row) => {
        const name = row.querySelector('[data-notification-field="name"]')?.value.trim() || "";
        const target = row.querySelector('[data-notification-field="target"]')?.value.trim() || "";
        if (!target || seen.has(target)) return null;
        seen.add(target);
        return { name: name || target, target };
      })
      .filter(Boolean);
  }

  bindNotificationRowButtons(content) {
    content.querySelectorAll("[data-remove-notification-row]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        button.closest("[data-notification-row]")?.remove();
        if (!content.querySelectorAll("[data-notification-row]").length) {
          this.addNotificationRow(content);
        }
      });
    });
  }

  globalMissionRows() {
    const missions = this.data.global_missions || [];
    if (!missions.length) {
      return `<p class="muted">No global missions have been posted yet.</p>`;
    }
    return missions
      .map((mission) => `
        <div class="row ${mission.done ? "mission-complete" : ""}">
          <div>
            <strong class="chore-name"><ha-icon icon="${this.escapeHtml(mission.icon || "mdi:rocket-launch")}"></ha-icon>${this.escapeHtml(mission.name)}</strong>
            <div class="muted">${mission.done ? "Done" : "Open"} - ${(mission.tasks || []).length} tasks</div>
            <div class="badge-list">${this.badgePills(mission.badges || [])}</div>
            ${(mission.tasks || []).map((task) => `<div class="muted">${this.taskStatusLabel(task)} - ${this.escapeHtml(task.name)} - ${Number(task.xp || 0)} XP${Number(task.reward || 0) ? ` - GBP ${Number(task.reward || 0).toFixed(2)}` : ""}</div>`).join("")}
            ${mission.description ? `<div class="muted">${this.escapeHtml(mission.description)}</div>` : ""}
          </div>
          <div>
            <button class="secondary" data-edit-global="${this.escapeHtml(mission.id)}">Edit</button>
            <button class="secondary" data-save-global-template="${this.escapeHtml(mission.id)}">Save template</button>
            <button class="danger" data-delete-global="${this.escapeHtml(mission.id)}">Delete</button>
          </div>
        </div>
      `)
      .join("");
  }

  globalTemplateRows() {
    const templates = this.data.global_mission_templates || [];
    if (!templates.length) {
      return `<p class="muted">No saved mission templates yet.</p>`;
    }
    return templates
      .map((template) => `
        <div class="row">
          <div>
            <strong class="chore-name"><ha-icon icon="${this.escapeHtml(template.icon || "mdi:rocket-launch")}"></ha-icon>${this.escapeHtml(template.name)}</strong>
            <div class="muted">${(template.tasks || []).length} tasks saved</div>
          </div>
          <div>
            <button data-launch-global-template="${this.escapeHtml(template.id)}">Launch</button>
            <button class="danger" data-delete-global-template="${this.escapeHtml(template.id)}">Delete</button>
          </div>
        </div>
      `)
      .join("");
  }

  selectedChoreChild() {
    const children = this.data.children || [];
    if (!children.length) return null;
    return children.find((child) => child.id === this.selectedChoreChildId) || children[0];
  }

  chorePlayerButtons() {
    const selected = this.selectedChoreChild();
    return (this.data.children || [])
      .map((child) => `
        <button class="secondary ${selected && selected.id === child.id ? "active" : ""}" data-chore-player="${this.escapeHtml(child.id)}">
          ${this.escapeHtml(child.name)}
        </button>
      `)
      .join("");
  }

  choreEditorGroups() {
    const child = this.selectedChoreChild();
    if (!child) return `<div class="card empty-state"><p class="muted">Add a child in Player management before creating personal quests.</p></div>`;
    const chores = (this.data.chores || []).filter((chore) => chore.child_id === child.id);
    return `
      <div class="chore-group">
        <h3>${this.escapeHtml(child.name)}</h3>
        ${chores.length ? chores.map((chore) => this.choreEditorRow(chore, child.id, false)).join("") : `<p class="muted">No personal quests for ${this.escapeHtml(child.name)} yet.</p>`}
        ${this.choreEditorRow({}, child.id, true)}
      </div>
    `;
  }

  choreEditorRow(chore, childId, isNew) {
    const editorId = chore.id || `new_${childId}`;
    const open = isNew || this.expandedChoreId === editorId;
    const title = chore.name || "Add new task";
    return `
      <div class="chore-editor ${open ? "open" : ""}" data-chore-row="${this.escapeHtml(chore.id || "")}" data-child-id="${this.escapeHtml(childId)}">
        <button type="button" class="secondary chore-editor-header" data-toggle-chore-editor="${this.escapeHtml(editorId)}">
          <strong><ha-icon icon="${this.escapeHtml(chore.icon || "mdi:clipboard-check")}"></ha-icon>${this.escapeHtml(title)}</strong>
          <span>${isNew ? "New" : open ? "Hide details" : "Edit"}</span>
        </button>
        <div class="chore-editor-body">
          <div class="chore-editor-line">
            <label>Task name<input data-chore-field="name" value="${this.escapeHtml(chore.name || "")}" placeholder="Brush teeth"></label>
            <label>Task icon${this.iconPickerInput('data-chore-field="icon"', chore.icon || "mdi:clipboard-check", "mdi:broom")}</label>
            <label>Task description<input data-chore-field="description" value="${this.escapeHtml(chore.description || "")}" placeholder="What should this include?"></label>
          </div>
          <div class="chore-editor-line">
            <label>Reward<input data-chore-field="reward" type="number" min="0" step="0.1" value="${Number(chore.reward || 0)}"></label>
            <label>XP<input data-chore-field="xp" type="number" min="0" step="1" value="${Number(chore.xp ?? 10)}"></label>
            <label>Badge
              <select data-chore-field="badges">
                ${this.badgeOptions((chore.badges || ["mandatory"])[0])}
              </select>
            </label>
          </div>
          <div class="chore-editor-line">
            <label>Schedule
              <select data-chore-field="schedule">
                <option value="none" ${this.scheduleValue(chore.schedule) === "none" ? "selected" : ""}>No schedule</option>
                <option value="daily" ${this.scheduleValue(chore.schedule) === "daily" ? "selected" : ""}>Daily</option>
                <option value="weekdays" ${this.scheduleValue(chore.schedule) === "weekdays" ? "selected" : ""}>Weekdays</option>
                <option value="weekend" ${this.scheduleValue(chore.schedule) === "weekend" ? "selected" : ""}>Weekend</option>
              </select>
            </label>
            <label>Repeat
              <select data-chore-field="repeat_mode">
                <option value="once_per_day" ${(chore.repeat_mode || "once_per_day") === "once_per_day" ? "selected" : ""}>Once per day</option>
                <option value="once_per_week" ${chore.repeat_mode === "once_per_week" ? "selected" : ""}>Once per week</option>
                <option value="unlimited" ${chore.repeat_mode === "unlimited" ? "selected" : ""}>Any time</option>
              </select>
            </label>
            <label>Ask quantity
              <select data-chore-field="quantity_enabled">
                <option value="false" ${!chore.quantity_enabled ? "selected" : ""}>No</option>
                <option value="true" ${chore.quantity_enabled ? "selected" : ""}>Yes</option>
              </select>
            </label>
          </div>
          <div class="chore-editor-line">
            <label>Requires approval
              <select data-chore-field="approval_required">
                <option value="true" ${chore.approval_required !== false ? "selected" : ""}>Yes</option>
                <option value="false" ${chore.approval_required === false ? "selected" : ""}>No, award straight away</option>
              </select>
            </label>
            <label>Quantity prompt<input data-chore-field="quantity_label" value="${this.escapeHtml(chore.quantity_label || "How many?")}"></label>
            <div class="chore-editor-actions">
              <button type="button" data-save-chore-row>${isNew ? "Add new task" : "Save"}</button>
              ${isNew ? "" : `<button type="button" class="danger" data-delete-chore-row="${this.escapeHtml(chore.id)}">Delete</button>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  readChoreRow(row) {
    const field = (name) => row.querySelector(`[data-chore-field="${name}"]`);
    const id = row.dataset.choreRow || undefined;
    return {
      id,
      name: field("name")?.value.trim() || "",
      child_id: row.dataset.childId || "",
      icon: field("icon")?.value.trim() || "mdi:clipboard-check",
      reward: Number(field("reward")?.value || 0),
      xp: Number(field("xp")?.value || 0),
      badges: field("badges")?.value || "",
      schedule: this.scheduleFromValue(field("schedule")?.value || "daily"),
      repeat_mode: field("repeat_mode")?.value || "once_per_day",
      quantity_enabled: field("quantity_enabled")?.value === "true",
      quantity_label: field("quantity_label")?.value.trim() || "How many?",
      description: field("description")?.value.trim() || "",
      approval_required: field("approval_required")?.value !== "false",
      enabled: true,
    };
  }

  anyoneQuestEditorGroups() {
    const quests = this.data.anyone_quests || [];
    return `
      <div class="chore-group">
        ${quests.length ? quests.map((quest) => this.anyoneQuestEditorRow(quest, false)).join("") : `<p class="muted">No anyone quests yet.</p>`}
        ${this.anyoneQuestEditorRow({}, true)}
      </div>
    `;
  }

  anyoneQuestEditorRow(quest, isNew) {
    const editorId = quest.id || "new_anyone_quest";
    const open = isNew || this.expandedAnyoneQuestId === editorId;
    const title = quest.name || "Add new anyone quest";
    return `
      <div class="chore-editor ${open ? "open" : ""}" data-anyone-row="${this.escapeHtml(quest.id || "")}">
        <button type="button" class="secondary chore-editor-header" data-toggle-anyone-editor="${this.escapeHtml(editorId)}">
          <strong><ha-icon icon="${this.escapeHtml(quest.icon || "mdi:account-group")}"></ha-icon>${this.escapeHtml(title)}</strong>
          <span>${isNew ? "New" : open ? "Hide details" : "Edit"}</span>
        </button>
        <div class="chore-editor-body">
          <div class="chore-editor-line">
            <label>Quest name<input data-anyone-field="name" value="${this.escapeHtml(quest.name || "")}" placeholder="Empty dishwasher"></label>
            <label>Quest icon${this.iconPickerInput('data-anyone-field="icon"', quest.icon || "mdi:account-group", "mdi:broom")}</label>
            <label>Quest description<input data-anyone-field="description" value="${this.escapeHtml(quest.description || "")}" placeholder="What should this include?"></label>
          </div>
          <div class="chore-editor-line">
            <label>Reward<input data-anyone-field="reward" type="number" min="0" step="0.1" value="${Number(quest.reward || 0)}"></label>
            <label>XP<input data-anyone-field="xp" type="number" min="0" step="1" value="${Number(quest.xp ?? 10)}"></label>
            <label>Badge
              <select data-anyone-field="badges">
                ${this.badgeOptions((quest.badges || ["team"])[0])}
              </select>
            </label>
          </div>
          <div class="chore-editor-line">
            <label>Schedule
              <select data-anyone-field="schedule">
                <option value="none" ${this.scheduleValue(quest.schedule) === "none" ? "selected" : ""}>No schedule</option>
                <option value="daily" ${this.scheduleValue(quest.schedule) === "daily" ? "selected" : ""}>Daily</option>
                <option value="weekdays" ${this.scheduleValue(quest.schedule) === "weekdays" ? "selected" : ""}>Weekdays</option>
                <option value="weekend" ${this.scheduleValue(quest.schedule) === "weekend" ? "selected" : ""}>Weekend</option>
              </select>
            </label>
            <label>Repeat
              <select data-anyone-field="repeat_mode">
                <option value="once_per_day" ${(quest.repeat_mode || "once_per_day") === "once_per_day" ? "selected" : ""}>Once per day</option>
                <option value="once_per_week" ${quest.repeat_mode === "once_per_week" ? "selected" : ""}>Once per week</option>
                <option value="unlimited" ${quest.repeat_mode === "unlimited" ? "selected" : ""}>Any time</option>
              </select>
            </label>
            <label>Ask quantity
              <select data-anyone-field="quantity_enabled">
                <option value="false" ${!quest.quantity_enabled ? "selected" : ""}>No</option>
                <option value="true" ${quest.quantity_enabled ? "selected" : ""}>Yes</option>
              </select>
            </label>
          </div>
          <div class="chore-editor-line">
            <label>Requires approval
              <select data-anyone-field="approval_required">
                <option value="true" ${quest.approval_required !== false ? "selected" : ""}>Yes</option>
                <option value="false" ${quest.approval_required === false ? "selected" : ""}>No, award straight away</option>
              </select>
            </label>
            <label>Quantity prompt<input data-anyone-field="quantity_label" value="${this.escapeHtml(quest.quantity_label || "How many?")}"></label>
            <div class="chore-editor-actions">
              <button type="button" data-save-anyone-row>${isNew ? "Add anyone quest" : "Save"}</button>
              ${isNew ? "" : `<button type="button" class="danger" data-delete-anyone-row="${this.escapeHtml(quest.id)}">Delete</button>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  readAnyoneQuestRow(row) {
    const field = (name) => row.querySelector(`[data-anyone-field="${name}"]`);
    const id = row.dataset.anyoneRow || undefined;
    return {
      id,
      name: field("name")?.value.trim() || "",
      icon: field("icon")?.value.trim() || "mdi:account-group",
      reward: Number(field("reward")?.value || 0),
      xp: Number(field("xp")?.value || 0),
      badges: field("badges")?.value || "team",
      schedule: this.scheduleFromValue(field("schedule")?.value || "daily"),
      repeat_mode: field("repeat_mode")?.value || "once_per_day",
      quantity_enabled: field("quantity_enabled")?.value === "true",
      quantity_label: field("quantity_label")?.value.trim() || "How many?",
      description: field("description")?.value.trim() || "",
      approval_required: field("approval_required")?.value !== "false",
      enabled: true,
    };
  }

  storeEditorRows() {
    const items = this.data.store_items || [];
    return `
      <div class="chore-group">
        ${items.length ? items.map((item) => this.storeEditorRow(item, false)).join("") : `<p class="muted">No store items yet.</p>`}
        ${this.storeEditorRow({}, true)}
      </div>
    `;
  }

  storeEditorRow(item, isNew) {
    const editorId = item.id || "new_store_item";
    const open = isNew || this.expandedStoreItemId === editorId;
    const title = item.title || "Add store item";
    const contributed = this.storeGoalContributed(item);
    return `
      <div class="chore-editor ${open ? "open" : ""}" data-store-row="${this.escapeHtml(item.id || "")}">
        <button type="button" class="secondary chore-editor-header" data-toggle-store-editor="${this.escapeHtml(editorId)}">
          <strong><ha-icon icon="${this.escapeHtml(item.icon || "mdi:gift")}"></ha-icon>${this.escapeHtml(title)}</strong>
          <span>${isNew ? "New" : open ? "Hide details" : "Edit"}</span>
        </button>
        <div class="chore-editor-body">
          <div class="chore-editor-line">
            <label>Title<input data-store-field="title" value="${this.escapeHtml(item.title || "")}" placeholder="Extra screen time"></label>
            <label>Type
              <select data-store-field="type">
                <option value="item" ${(item.type || "item") === "item" ? "selected" : ""}>Store item</option>
                <option value="goal" ${item.type === "goal" ? "selected" : ""}>Shared goal</option>
              </select>
            </label>
            <label>XP price<input data-store-field="price" type="number" min="0" step="1" value="${Number(item.price || 0)}"></label>
          </div>
          <div class="chore-editor-line">
            <label>Icon${this.iconPickerInput('data-store-field="icon"', item.icon || "mdi:gift", "mdi:gift")}</label>
            <label>Picture URL<input data-store-field="image_url" value="${this.escapeHtml(item.image_url || "")}" placeholder="/local/sidequest/reward.png"></label>
            <label>Enabled
              <select data-store-field="enabled">
                <option value="true" ${item.enabled !== false ? "selected" : ""}>Yes</option>
                <option value="false" ${item.enabled === false ? "selected" : ""}>No</option>
              </select>
            </label>
          </div>
          <div class="chore-editor-line">
            <label>Description<input data-store-field="description" value="${this.escapeHtml(item.description || "")}" placeholder="What does this unlock?"></label>
            <div>
              ${item.type === "goal" ? `<span class="pill">${contributed} / ${Number(item.price || 0)} XP funded</span>` : ""}
            </div>
            <div class="chore-editor-actions">
              <button type="button" data-save-store-row>${isNew ? "Add store item" : "Save"}</button>
              ${isNew ? "" : `<button type="button" class="danger" data-delete-store-row="${this.escapeHtml(item.id)}">Delete</button>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  readStoreRow(row) {
    const field = (name) => row.querySelector(`[data-store-field="${name}"]`);
    return {
      id: row.dataset.storeRow || undefined,
      title: field("title")?.value.trim() || "",
      type: field("type")?.value || "item",
      price: Number(field("price")?.value || 0),
      icon: field("icon")?.value.trim() || "mdi:gift",
      image_url: field("image_url")?.value.trim() || "",
      description: field("description")?.value.trim() || "",
      enabled: field("enabled")?.value !== "false",
    };
  }

  adminActiveTokenCards() {
    const tokens = (this.data.store_tokens || []).filter((token) => token.status === "active");
    if (!tokens.length) {
      return `<div class="card empty-state"><p class="muted">No active reward tokens waiting to be cashed in.</p></div>`;
    }
    return tokens.map((token) => this.storeTokenCard(token)).join("");
  }

  taskStatusLabel(task) {
    if (task.status === "approved") return "[done]";
    if (task.status === "pending") return "[approval]";
    return "[open]";
  }

  badgePills(badges) {
    const list = Array.isArray(badges) ? badges : String(badges || "").split(",");
    return list
      .filter((badge) => String(badge).trim())
      .map((badge) => {
        const meta = this.badgeMeta(badge);
        return `<span class="mission-badge">${this.escapeHtml(meta.symbol)} ${this.escapeHtml(meta.label)}</span>`;
      })
      .join("");
  }

  badgeOptions(selected) {
    const options = [
      ["mandatory", "Core Mission"],
      ["extra", "Bonus Mission"],
      ["team", "Team Mission"],
      ["quick", "Quick Win"],
      ["big", "Big Mission"],
      ["hard", "Hero Mission"],
    ];
    return options
      .map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`)
      .join("");
  }

  iconPickerInput(attributes, value, placeholder) {
    return `
      <div class="icon-picker" data-icon-picker>
        <input ${attributes} data-icon-input placeholder="${this.escapeHtml(placeholder || "mdi:clipboard-check")}" value="${this.escapeHtml(value || "")}">
        <button type="button" class="secondary" data-icon-toggle title="Choose icon">
          <ha-icon icon="${this.escapeHtml(value || "mdi:clipboard-check")}"></ha-icon>
        </button>
        <div class="icon-picker-menu" data-icon-menu hidden>
          <input class="icon-picker-search" data-icon-search placeholder="Search icons">
          <div class="icon-picker-options" data-icon-options></div>
        </div>
      </div>
    `;
  }

  iconChoices() {
    return [
      ["mdi:account-child", "Child"],
      ["mdi:account-group", "Team"],
      ["mdi:account-supervisor", "Parent"],
      ["mdi:alarm", "Timer"],
      ["mdi:archive", "Put away"],
      ["mdi:basket", "Basket"],
      ["mdi:bed", "Bed"],
      ["mdi:book-open-page-variant", "Reading"],
      ["mdi:broom", "Cleaning"],
      ["mdi:brush", "Brush"],
      ["mdi:bucket", "Bucket"],
      ["mdi:calendar-check", "Schedule"],
      ["mdi:cash", "Money"],
      ["mdi:cash-sync", "Pocket money"],
      ["mdi:check", "Check"],
      ["mdi:check-decagram", "Approved"],
      ["mdi:clipboard-check", "Chore"],
      ["mdi:clothes-hanger", "Clothes"],
      ["mdi:crown", "Crown"],
      ["mdi:delete", "Bins"],
      ["mdi:dishwasher", "Dishwasher"],
      ["mdi:dog", "Pet"],
      ["mdi:door", "Hallway"],
      ["mdi:food-apple", "Food"],
      ["mdi:food-drumstick", "Feed pet"],
      ["mdi:gamepad-variant", "Games"],
      ["mdi:gift", "Bonus"],
      ["mdi:hand-heart", "Helping"],
      ["mdi:home", "Home"],
      ["mdi:home-floor-0", "Downstairs"],
      ["mdi:home-floor-1", "Upstairs"],
      ["mdi:lightning-bolt", "Quick"],
      ["mdi:medal", "Medal"],
      ["mdi:mop", "Mop"],
      ["mdi:paw", "Animal"],
      ["mdi:recycle", "Recycling"],
      ["mdi:rocket-launch", "Rocket"],
      ["mdi:rocket-outline", "Cadet"],
      ["mdi:shield-star", "Rank"],
      ["mdi:silverware-fork-knife", "Kitchen"],
      ["mdi:sink", "Sink"],
      ["mdi:sofa", "Sofa"],
      ["mdi:sparkles", "Special"],
      ["mdi:space-station", "Command deck"],
      ["mdi:star", "Star"],
      ["mdi:star-shooting", "Star captain"],
      ["mdi:stairs", "Stairs"],
      ["mdi:table-chair", "Table"],
      ["mdi:toothbrush", "Teeth"],
      ["mdi:trophy", "Trophy"],
      ["mdi:tshirt-crew", "Laundry"],
      ["mdi:vacuum", "Hoover"],
      ["mdi:washing-machine", "Washing"],
      ["mdi:water", "Wipe down"],
    ];
  }

  bindIconPickers(content) {
    content.querySelectorAll("[data-icon-picker]").forEach((picker) => {
      if (picker.dataset.bound) return;
      picker.dataset.bound = "true";
      const input = picker.querySelector("[data-icon-input]");
      const toggle = picker.querySelector("[data-icon-toggle]");
      const menu = picker.querySelector("[data-icon-menu]");
      const search = picker.querySelector("[data-icon-search]");
      const options = picker.querySelector("[data-icon-options]");
      const renderOptions = () => {
        const query = String(search.value || input.value || "").toLowerCase();
        const matches = this.iconChoices()
          .filter(([icon, label]) => `${icon} ${label}`.toLowerCase().includes(query))
          .slice(0, 36);
        options.innerHTML = matches.map(([icon, label]) => `
          <button type="button" class="icon-option" data-icon-choice="${this.escapeHtml(icon)}">
            <ha-icon icon="${this.escapeHtml(icon)}"></ha-icon>
            <span><strong>${this.escapeHtml(label)}</strong><span>${this.escapeHtml(icon)}</span></span>
          </button>
        `).join("") || `<p class="muted">No matching icons.</p>`;
        options.querySelectorAll("[data-icon-choice]").forEach((button) => {
          button.addEventListener("click", () => {
            input.value = button.dataset.iconChoice;
            toggle.querySelector("ha-icon").setAttribute("icon", button.dataset.iconChoice);
            menu.hidden = true;
          });
        });
      };
      toggle.addEventListener("click", () => {
        menu.hidden = !menu.hidden;
        if (!menu.hidden) {
          search.value = "";
          renderOptions();
          search.focus();
        }
      });
      input.addEventListener("input", () => {
        toggle.querySelector("ha-icon").setAttribute("icon", input.value || "mdi:clipboard-check");
        if (!menu.hidden) renderOptions();
      });
      search.addEventListener("input", renderOptions);
    });
  }

  badgeMeta(badge) {
    const key = String(badge || "").trim().toLowerCase();
    const badges = {
      mandatory: { symbol: "!", label: "Core Mission" },
      required: { symbol: "!", label: "Core Mission" },
      extra: { symbol: "+", label: "Bonus Mission" },
      bonus: { symbol: "+", label: "Bonus Mission" },
      team: { symbol: "^", label: "Team Mission" },
      quick: { symbol: ">", label: "Quick Win" },
      big: { symbol: "*", label: "Big Mission" },
      hard: { symbol: "*", label: "Hero Mission" },
    };
    return badges[key] || { symbol: "#", label: this.titleCase(key || "mission") };
  }

  titleCase(value) {
    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  rankSettings() {
    const ranks = this.data.settings?.ranks;
    const fallback = [
      { name: "Cadet", xp: 0, icon: "mdi:rocket-outline" },
      { name: "Pilot", xp: 50, icon: "mdi:rocket-launch" },
      { name: "Commander", xp: 120, icon: "mdi:shield-star" },
      { name: "Star Captain", xp: 250, icon: "mdi:star-shooting" },
      { name: "SideQuest Legend", xp: 500, icon: "mdi:crown" },
    ];
    const source = Array.isArray(ranks) && ranks.length ? ranks : fallback;
    return source
      .map((rank) => ({
        name: String(rank.name || "").trim(),
        xp: Math.max(0, Number(rank.xp || 0)),
        icon: String(rank.icon || "mdi:rocket-outline").trim() || "mdi:rocket-outline",
      }))
      .filter((rank) => rank.name)
      .sort((a, b) => a.xp - b.xp);
  }

  rankEditorRows() {
    return this.rankSettings().map((rank, index) => this.rankEditorRow(rank, index)).join("");
  }

  rankEditorRow(rank = {}, index = 0) {
    return `
      <tr data-rank-row>
        <td><input name="name" required placeholder="Cadet" value="${this.escapeHtml(rank.name || "")}"></td>
        <td><input name="xp" type="number" min="0" step="1" value="${this.escapeHtml(rank.xp ?? 0)}"></td>
        <td>${this.iconPickerInput('name="icon"', rank.icon || "mdi:rocket-outline", "mdi:rocket-outline")}</td>
        <td><button type="button" class="danger" data-remove-rank-row="${index}">Delete</button></td>
      </tr>
    `;
  }

  addRankRow(content) {
    const tbody = content.querySelector("#rank-rows");
    if (!tbody) return;
    tbody.insertAdjacentHTML("beforeend", this.rankEditorRow({ name: "", xp: 0, icon: "mdi:rocket-outline" }, tbody.children.length));
    this.bindRankRowButtons(content);
    this.bindIconPickers(content);
  }

  bindRankRowButtons(content) {
    content.querySelectorAll("[data-remove-rank-row]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        button.closest("[data-rank-row]")?.remove();
      });
    });
  }

  readRankRows(content) {
    return Array.from(content.querySelectorAll("[data-rank-row]"))
      .map((row) => ({
        name: row.querySelector('[name="name"]')?.value.trim() || "",
        xp: Math.max(0, Number(row.querySelector('[name="xp"]')?.value || 0)),
        icon: row.querySelector('[name="icon"]')?.value.trim() || "mdi:rocket-outline",
      }))
      .filter((rank) => rank.name)
      .sort((a, b) => a.xp - b.xp);
  }

  rankBadge(rank, xp) {
    return `
      <div class="rank-badge">
        <ha-icon icon="${this.escapeHtml(this.rankIcon(rank))}"></ha-icon>
        <span>${this.escapeHtml(rank)} - ${Number(xp || 0)} rank XP</span>
      </div>
    `;
  }

  rankIcon(rank) {
    const match = this.rankSettings().find((item) => item.name === rank);
    return match?.icon || "mdi:rocket-outline";
  }

  rankForXp(xp) {
    const value = Number(xp || 0);
    const ranks = this.rankSettings();
    let current = ranks[0] || { name: "Cadet" };
    for (const rank of ranks) {
      if (value >= Number(rank.xp || 0)) {
        current = rank;
      }
    }
    return current.name;
  }

  pendingRow(claim) {
    const chore = this.data.chores.find((item) => item.id === claim.chore_id);
    if (!chore) return "";
    const reward = Number(chore.reward || 0);
    const quantity = Number(claim.quantity || 1);
    const fullReward = reward * quantity;
    const quantityText = quantity > 1 ? ` - Quantity ${quantity}` : "";
    return `
      <div class="row">
        <div>
          <strong>${this.escapeHtml(this.childName(chore.child_id))} - ${this.escapeHtml(chore.name)}</strong>
          <div class="muted">Claimed ${new Date(claim.claimed_at).toLocaleString()}${quantityText} - Full reward GBP ${fullReward.toFixed(2)}</div>
        </div>
        <div class="rating-actions" aria-label="Approve mission rating">
          ${[1, 2, 3, 4, 5].map((rating) => `
            <button title="${rating} star approval pays GBP ${(fullReward * (rating / 5)).toFixed(2)}" data-approve="${this.escapeHtml(chore.id)}" data-rating="${rating}">
              ${"&#9733;".repeat(rating)}
            </button>
          `).join("")}
          <button class="danger" data-deny="${this.escapeHtml(chore.id)}">Deny</button>
        </div>
      </div>
    `;
  }

  anyonePendingRow(claim) {
    const quest = this.data.anyone_quests.find((item) => item.id === claim.quest_id);
    if (!quest) return "";
    const reward = Number(quest.reward || 0);
    const quantity = Number(claim.quantity || 1);
    const fullReward = reward * quantity;
    const quantityText = quantity > 1 ? ` - Quantity ${quantity}` : "";
    return `
      <div class="row">
        <div>
          <strong>${this.escapeHtml(this.childName(claim.child_id))} - ${this.escapeHtml(quest.name)}</strong>
          <div class="muted">Anyone quest - claimed ${new Date(claim.claimed_at).toLocaleString()}${quantityText} - Full reward GBP ${fullReward.toFixed(2)}</div>
        </div>
        <div class="rating-actions" aria-label="Approve shared quest rating">
          ${[1, 2, 3, 4, 5].map((rating) => `
            <button title="${rating} star approval pays GBP ${(fullReward * (rating / 5)).toFixed(2)}" data-approve-anyone="${this.escapeHtml(quest.id)}" data-rating="${rating}">
              ${"&#9733;".repeat(rating)}
            </button>
          `).join("")}
          <button class="danger" data-deny-anyone="${this.escapeHtml(quest.id)}">Deny</button>
        </div>
      </div>
    `;
  }

  globalPendingTaskRows() {
    const pendingTasks = [];
    for (const mission of this.data.global_missions || []) {
      for (const task of mission.tasks || []) {
        if (task.status === "pending") {
          pendingTasks.push({ mission, task });
        }
      }
    }
    if (!pendingTasks.length) return "";
    return pendingTasks
      .map(({ mission, task }) => `
        <div class="row">
          <div>
            <strong>${this.escapeHtml(mission.name)} - ${this.escapeHtml(task.name)}</strong>
            <div class="muted">Claimed by ${this.escapeHtml(this.childName(task.claimed_child_id))} - ${Number(task.xp || 0)} XP${Number(task.reward || 0) ? ` - GBP ${Number(task.reward || 0).toFixed(2)}` : ""}</div>
          </div>
          <div>
            <button data-approve-global-task data-mission-id="${this.escapeHtml(mission.id)}" data-task-id="${this.escapeHtml(task.id)}">Approve</button>
            <button class="danger" data-deny-global-task data-mission-id="${this.escapeHtml(mission.id)}" data-task-id="${this.escapeHtml(task.id)}">Deny</button>
          </div>
        </div>
      `)
      .join("");
  }

  adminChoreRow(chore) {
    return `
      <div class="row">
        <div>
          <strong class="chore-name"><ha-icon icon="${this.escapeHtml(chore.icon || "mdi:clipboard-check")}"></ha-icon>${this.escapeHtml(this.childName(chore.child_id))} - ${this.escapeHtml(chore.name)}</strong>
          <div class="muted">${this.escapeHtml(this.scheduleLabel(chore.schedule))} - ${this.escapeHtml(this.repeatLabel(chore.repeat_mode))} - GBP ${Number(chore.reward).toFixed(2)} - ${Number(chore.xp || 0)} XP</div>
          <div class="badge-list">${this.badgePills(chore.badges || [])}</div>
          ${chore.description ? `<div class="muted">${this.escapeHtml(chore.description)}</div>` : ""}
        </div>
        <div>
          <button class="secondary" data-edit="${this.escapeHtml(chore.id)}">Edit</button>
          <button class="danger" data-delete="${this.escapeHtml(chore.id)}">Delete</button>
        </div>
      </div>
    `;
  }

  adminChoresByChild() {
    if (!this.data.chores.length) {
      return `<p class="muted">No personal quests yet.</p>`;
    }
    return this.data.children
      .map((child) => {
        const chores = this.data.chores.filter((chore) => chore.child_id === child.id);
        if (!chores.length) return "";
        return `
          <div style="margin-top:16px">
            <h3>${this.escapeHtml(child.name)}</h3>
            ${chores.map((chore) => this.adminChoreRow(chore)).join("")}
          </div>
        `;
      })
      .join("");
  }

  fillGlobalMissionForm(form, mission) {
    const content = this.querySelector("#content");
    form.elements.id.value = mission.id;
    form.elements.name.value = mission.name;
    form.elements.icon.value = mission.icon || "mdi:rocket-launch";
    form.elements.badges.value = (mission.badges || []).join(", ");
    form.elements.description.value = mission.description || "";
    const rows = content.querySelector("#global-task-rows");
    if (rows) {
      rows.innerHTML = this.globalTaskEditorRows(mission.tasks || []);
      this.bindGlobalTaskRowButtons(content);
    }
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  clearGlobalMissionForm(form) {
    const content = this.querySelector("#content");
    form.elements.id.value = "";
    form.elements.name.value = "";
    form.elements.icon.value = "mdi:rocket-launch";
    form.elements.badges.value = "team";
    form.elements.description.value = "";
    const rows = content.querySelector("#global-task-rows");
    if (rows) {
      rows.innerHTML = this.globalTaskEditorRows([]);
      this.bindGlobalTaskRowButtons(content);
    }
  }

  globalTaskEditorRows(tasks) {
    const rows = tasks && tasks.length ? tasks : [{ name: "", description: "", xp: 5, reward: 0, approval_required: true }];
    return rows.map((task, index) => this.globalTaskEditorRow(task, index)).join("");
  }

  globalTaskEditorRow(task, index) {
    return `
      <tr>
        <td><input class="task-name" data-task-field="name" value="${this.escapeHtml(task.name || "")}" placeholder="Clear counters"></td>
        <td><input class="task-description" data-task-field="description" value="${this.escapeHtml(task.description || "")}" placeholder="Optional detail"></td>
        <td><input data-task-field="xp" type="number" min="0" step="1" value="${Number(task.xp ?? 5)}"></td>
        <td><input data-task-field="reward" type="number" min="0" step="0.1" value="${Number(task.reward || 0)}"></td>
        <td>
          <select data-task-field="approval_required">
            <option value="true" ${task.approval_required !== false ? "selected" : ""}>Yes</option>
            <option value="false" ${task.approval_required === false ? "selected" : ""}>No</option>
          </select>
        </td>
        <td><button type="button" class="danger" data-remove-global-task-row="${index}">Remove</button></td>
      </tr>
    `;
  }

  readGlobalTaskRows(content) {
    return Array.from(content.querySelectorAll("#global-task-rows tr"))
      .map((row, index) => {
        const field = (name) => row.querySelector(`[data-task-field="${name}"]`);
        const name = field("name")?.value.trim();
        if (!name) return null;
        return {
          id: this.slug(`${index + 1}_${name}`),
          name,
          description: field("description")?.value.trim() || "",
          xp: Number(field("xp")?.value || 0),
          reward: Number(field("reward")?.value || 0),
          approval_required: field("approval_required")?.value !== "false",
          status: "open",
        };
      })
      .filter(Boolean);
  }

  addGlobalTaskRow(content) {
    const rows = content.querySelector("#global-task-rows");
    if (!rows) return;
    rows.insertAdjacentHTML("beforeend", this.globalTaskEditorRow({}, rows.children.length));
    this.bindGlobalTaskRowButtons(content);
  }

  bindGlobalTaskRowButtons(content) {
    content.querySelectorAll("[data-remove-global-task-row]").forEach((button) => {
      button.onclick = () => {
        button.closest("tr")?.remove();
        if (!content.querySelectorAll("#global-task-rows tr").length) {
          this.addGlobalTaskRow(content);
        }
      };
    });
  }

  slug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  scheduleValue(schedule) {
    if (schedule && schedule.type === "none") return "none";
    if (!schedule || schedule.type === "daily") return "daily";
    const days = (schedule.days || []).join(",");
    if (days === "0,1,2,3,4") return "weekdays";
    if (days === "5,6") return "weekend";
    return "daily";
  }

  historyRow(event) {
    const value = Number(event.reward || 0);
    const baseReward = Number(event.base_reward || event.reward || 0);
    const rating = event.rating ? Number(event.rating) : null;
    const created = event.created_at ? new Date(event.created_at).toLocaleString() : "";
    const canReverse = [
      "approved",
      "anyone_approved",
      "global_task_approved",
      "global_task_completed",
      "money_adjustment",
      "store_purchase",
      "store_goal_contribution",
    ].includes(event.type);
    const actionText = canReverse ? "Delete and subtract" : "Delete";
    const ratingText = rating ? ` - ${rating}/5 stars` : "";
    const quantity = Number(event.quantity || 1);
    const quantityText = quantity > 1 ? ` - x${quantity}` : "";
    const rewardText = value ? ` - GBP ${value.toFixed(2)}${baseReward && baseReward !== value ? ` of GBP ${baseReward.toFixed(2)}` : ""}` : "";
    const xpText = event.xp ? ` - ${Number(event.xp)} XP` : "";
    const noteText = event.note ? ` - ${this.escapeHtml(event.note)}` : "";
    return `
      <div class="row">
        <div>
          <strong>${this.escapeHtml(this.childName(event.child_id))} - ${this.escapeHtml(event.chore_name || event.quest_name || event.chore_id || event.quest_id)}</strong>
          <div class="muted">${this.escapeHtml(event.type)}${ratingText}${quantityText}${rewardText}${xpText}${noteText} - ${this.escapeHtml(created)}</div>
        </div>
        <button class="${canReverse ? "danger" : "secondary"}" data-delete-history="${this.escapeHtml(event.id)}">${actionText}</button>
      </div>
    `;
  }

  repeatLabel(repeatMode) {
    if (repeatMode === "unlimited") return "Any time";
    if (repeatMode === "once_per_week") return "Once per week";
    return "Once per day";
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

if (!customElements.get("chore-quest-panel")) {
  customElements.define("chore-quest-panel", SideQuestPanel);
}
