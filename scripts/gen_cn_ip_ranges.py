#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成中国(CN) IP 段列表模块 src/lib/cn-ip-ranges.ts
数据源：APNIC delegated-apnic-latest（每天更新）
用法：python scripts/gen_cn_ip_ranges.py
输出：
  CN_IPV4_RANGES: Array<[number, number]>  (uint32 区间，已排序合并)
  CN_IPV6_RANGES: Array<[string, string]>  (32位hex字符串区间，字典序==数值序，已排序合并)
"""
import ipaddress
import os
import sys
import urllib.request

URL = "https://ftp.apnic.net/stats/apnic/delegated-apnic-latest"
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "lib", "cn-ip-ranges.ts")


def fetch():
    print(f"downloading {URL} ...")
    with urllib.request.urlopen(URL, timeout=120) as r:
        return r.read().decode("utf-8")


def parse(data):
    v4, v6 = [], []
    for line in data.splitlines():
        if line.startswith("#") or not line.strip():
            continue
        parts = line.split("|")
        if len(parts) < 7 or parts[1] != "CN":
            continue
        rtype, start, val = parts[2], parts[3], parts[4]
        if rtype == "ipv4":
            n = int(val)
            first = int(ipaddress.IPv4Address(start))
            v4.append((first, first + n - 1))
        elif rtype == "ipv6":
            net = ipaddress.IPv6Network(f"{start}/{val}")
            first = int(net.network_address)
            last = int(net.broadcast_address)
            v6.append((first, last))
    return v4, v6


def merge(ranges):
    ranges.sort()
    out = []
    for s, e in ranges:
        if out and s <= out[-1][1] + 1:
            out[-1] = (out[-1][0], max(out[-1][1], e))
        else:
            out.append((s, e))
    return out


def main():
    data = fetch()
    v4, v6 = parse(data)
    v4 = merge(v4)
    v6 = merge(v6)
    print(f"raw v4={len(v4)} v6={len(v6)} (after merge)")

    lines = []
    lines.append("// 自动生成：中国(CN) IP 段列表 —— 勿手改。")
    lines.append("// 来源：APNIC delegated-apnic-latest，生成脚本 scripts/gen_cn_ip_ranges.py")
    lines.append("// IPv4 区间为 uint32 数值（已排序合并）；IPv6 为 32 位 hex 字符串（字典序==数值序）。")
    lines.append("")
    lines.append("export const CN_IPV4_RANGES: Array<[number, number]> = [")
    for s, e in v4:
        lines.append(f"  [{s}, {e}],")
    lines.append("];")
    lines.append("")
    lines.append("export const CN_IPV6_RANGES: Array<[string, string]> = [")
    for s, e in v6:
        lines.append(f'  ["{s:032x}", "{e:032x}"],')
    lines.append("];")
    lines.append("")
    lines.append(f"export const CN_IPV4_COUNT = {len(v4)};")
    lines.append(f"export const CN_IPV6_COUNT = {len(v6)};")

    out = "\n".join(lines)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"written: {os.path.abspath(OUT_PATH)} ({len(out)/1024:.1f} KB)")


if __name__ == "__main__":
    main()
