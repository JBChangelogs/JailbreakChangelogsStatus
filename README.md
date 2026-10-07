<p align="center">
  <img src="https://assets.jailbreakchangelogs.com/assets/logos/JBCL_Long_Transparent.png" alt="Jailbreak Changelogs" width="520">
</p>

<p align="center">
  The status page for Jailbreak Changelogs: live health of the website, APIs and bots.
</p>

<p align="center">
  <a href="https://status.jailbreakchangelogs.com"><strong>Status Page</strong></a> •
  <a href="https://jailbreakchangelogs.com">Website</a> •
  <a href="https://github.com/JBChangelogs/JailbreakChangelogs">Main Repo</a>
</p>

<p align="center">
  <a href="https://discord.jailbreakchangelogs.com"><img alt="Discord" src="https://img.shields.io/discord/1286064050135896064?logo=discord&logoColor=white&label=Discord&color=4d3dff"></a>
  <a href="https://status.jailbreakchangelogs.com"><img alt="Status" src="https://uptime.jailbreakchangelogs.com/api/badge/2/status"></a>
</p>

---

> [!NOTE]
> This is a fan-made project operated by Jailbreak Changelogs LLC and is not affiliated with or endorsed by Badimo — the development team behind Roblox Jailbreak.

---

## Running Locally

Requires Node.js 22.6+.

```bash
npm install
cp .env.example .env.local   # then fill in the URLs
npm run dev
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Main site, used for header and footer links |
| `NEXT_PUBLIC_STATUS_API_URL` | Uptime status endpoint the page polls every minute |
| `NEXT_PUBLIC_INVENTORIES_API_URL` | Inventories API base, used for live bot counts |

Run the tests with `npm test`.

---

## Acknowledgements

- [Jakobiis](https://github.com/Jakobiis/) — Co-founder, Lead Back-end Developer & API Architect
- [Jalenzz16](https://github.com/Jalenzzz) — Co-founder & Lead Front-end Developer
