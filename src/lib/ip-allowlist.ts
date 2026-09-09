/**
 * Minimal IPv4/IPv6 CIDR matching for the pre-launch gate.
 *
 * Runs in the edge runtime, so no Node `net` module — addresses are converted
 * to BigInt and compared by prefix.
 */

type ParsedIp = { version: 4 | 6; value: bigint };

function parseIpv4(input: string): bigint | null {
  const parts = input.split(".");
  if (parts.length !== 4) return null;
  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n > 255) return null;
    value = (value << 8n) | BigInt(n);
  }
  return value;
}

function parseIpv6(input: string): bigint | null {
  // Drop any zone index (fe80::1%eth0).
  let s = input.split("%")[0];

  // Expand a trailing embedded IPv4 (::ffff:10.0.0.1) into two hex groups.
  const lastColon = s.lastIndexOf(":");
  if (lastColon !== -1 && s.slice(lastColon + 1).includes(".")) {
    const v4 = parseIpv4(s.slice(lastColon + 1));
    if (v4 === null) return null;
    const hi = (v4 >> 16n) & 0xffffn;
    const lo = v4 & 0xffffn;
    s = `${s.slice(0, lastColon + 1)}${hi.toString(16)}:${lo.toString(16)}`;
  }

  let groups: string[];
  const doubleColon = s.indexOf("::");
  if (doubleColon !== -1) {
    const head = s.slice(0, doubleColon) ? s.slice(0, doubleColon).split(":") : [];
    const tail = s.slice(doubleColon + 2) ? s.slice(doubleColon + 2).split(":") : [];
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    groups = [...head, ...Array<string>(fill).fill("0"), ...tail];
  } else {
    groups = s.split(":");
  }
  if (groups.length !== 8) return null;

  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
    value = (value << 16n) | BigInt(parseInt(group, 16));
  }
  return value;
}

export function parseIp(input: string): ParsedIp | null {
  const s = input.trim();
  if (!s) return null;

  if (s.includes(":")) {
    // IPv4-mapped addresses are treated as the IPv4 address they represent,
    // so a v4 rule still matches a request that arrived over a v6 socket.
    const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(s);
    if (mapped) {
      const v4 = parseIpv4(mapped[1]);
      return v4 === null ? null : { version: 4, value: v4 };
    }
    const v6 = parseIpv6(s);
    return v6 === null ? null : { version: 6, value: v6 };
  }

  const v4 = parseIpv4(s);
  return v4 === null ? null : { version: 4, value: v4 };
}

/** Matches `ip` against a single `addr` or `addr/prefix` rule. */
export function ipMatchesCidr(ip: string, cidr: string): boolean {
  const [addrPart, prefixPart] = cidr.trim().split("/");
  const net = parseIp(addrPart);
  const target = parseIp(ip);
  if (!net || !target || net.version !== target.version) return false;

  const totalBits = net.version === 4 ? 32 : 128;
  const prefix = prefixPart === undefined ? totalBits : Number(prefixPart);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > totalBits) return false;

  const shift = BigInt(totalBits - prefix);
  return net.value >> shift === target.value >> shift;
}

export function isIpAllowed(ip: string | null, rules: string[]): boolean {
  if (!ip) return false;
  return rules.some((rule) => rule && ipMatchesCidr(ip, rule));
}

/** Comma/whitespace separated list, e.g. from an env var. */
export function parseRules(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((r) => r.trim())
    .filter(Boolean);
}
