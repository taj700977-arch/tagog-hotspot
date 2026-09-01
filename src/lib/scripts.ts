import type { GeneratedScript } from "./types";

export const scriptTemplates: Omit<GeneratedScript, "body">[] = [
  {
    id: "purge-hotspot",
    title: "purgeScriptHotspot",
    description: "Purge expired hotspot users",
    language: "RouterOS",
  },
  {
    id: "purge-um",
    title: "purgeScriptUm",
    description: "Purge expired User Manager vouchers",
    language: "RouterOS",
  },
  {
    id: "scheduler",
    title: "schedulerScript",
    description: "Automatic scheduler for purge",
    language: "RouterOS",
  },
  {
    id: "bandwidth",
    title: "bandwidthLimitScript",
    description: "Apply bandwidth limits",
    language: "RouterOS",
  },
];

export function generateScript(
  id: string,
  opts: { profile: string; timeLimitMinutes: number; dataLimitMb: number; ssid: string }
): string {
  const timeStr =
    opts.timeLimitMinutes > 0
      ? `${Math.floor(opts.timeLimitMinutes / 60)}h${opts.timeLimitMinutes % 60}m`
      : "1d";
  const dataStr = opts.dataLimitMb > 0 ? `${opts.dataLimitMb}M` : "0";

  switch (id) {
    case "purge-hotspot":
      return `# TAGOG HOTSPOT - Purge expired hotspot users
# Paste in MikroTik: System -> Scripts -> New
:local profile "${opts.profile}";
:local count 0;
:foreach i in=[/ip hotspot user find where profile=$profile disabled=no] do={
  :local u [/ip hotspot user get $i name];
  :local ut [/ip hotspot user get $i uptime];
  :local limit [/ip hotspot user get $i limit-uptime];
  :if ([:len $limit] > 0) do={
    :if ($ut = $limit || $ut > $limit) do={
      /ip hotspot user remove $i;
      :set count ($count + 1);
      :put "Removed expired user: $u";
    }
  }
}
:put "TAGOG HOTSPOT: Purged $count expired hotspot users.";`;

    case "purge-um":
      return `# TAGOG HOTSPOT - Purge expired User Manager vouchers
# Paste in MikroTik terminal
:local count 0;
/tool user-manager user
:foreach i in=[find where disabled=no] do={
  :local name [get $i name];
  :local uptime [get $i uptime];
  :local limit [get $i "uptime-limit"];
  :if ([:len $limit] > 0) do={
    :if ($uptime >= $limit) do={
      remove $i;
      :set count ($count + 1);
      :put "Removed expired UM voucher: $name";
    }
  }
}
:put "TAGOG HOTSPOT: Purged $count expired UM vouchers.";`;

    case "scheduler":
      return `# TAGOG HOTSPOT - Automatic scheduler (runs purge every hour)
/system scheduler
add name="tagog-purge-hotspot" interval=1h on-event="
  /ip hotspot user remove [find where uptime >= limit-uptime];
" comment="TAGOG HOTSPOT auto-purge" disabled=no;

add name="tagog-purge-um" interval=1h on-event="
  /tool user-manager user remove [find where uptime >= uptime-limit];
" comment="TAGOG HOTSPOT auto-purge UM" disabled=no;

:put "TAGOG HOTSPOT: Schedulers installed (every 1h).";`;

    case "bandwidth":
      return `# TAGOG HOTSPOT - Apply bandwidth limit profile
/ip hotspot user profile
add name="${opts.profile}" rate-limit="${
        opts.timeLimitMinutes > 0 ? `${opts.timeLimitMinutes}k/${opts.timeLimitMinutes}k` : "1M/1M"
      }" shared-users=2 ${
        opts.dataLimitMb > 0 ? `session-timeout=${timeStr} shared-users=2` : ""
      } on-login="" on-logout="" transparent-proxy=no;

:put "TAGOG HOTSPOT: Profile '${opts.profile}' created.";
# Assign profile to users:
# /ip hotspot user set [find] profile="${opts.profile}";`;

    default:
      return "# Unknown script template";
  }
}
