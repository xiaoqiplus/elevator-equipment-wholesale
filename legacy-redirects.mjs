/**
 * 旧 URL → 新 URL 的 301/308 映射（2026-11-18）
 *
 * 为什么需要：2026-08-02 的 e77bf01（migrate-brands）把 ~80 个品牌的产品
 * 搬到 `other` 品牌后删掉空品牌、把 16 个 `elevator-pcb-*` 分类并入
 * `elevator-pcb`。这些旧页面在迁站前已被 Google 抓走，迁移后集体 404。
 * GSC 当前报「未找到（404）129」，有证据的构成：
 *   80 旧品牌 + 20 旧分类 + 4 旧路由 + 8 个问题 SKU + 2 个已删 SKU ≈ 114，
 *   残差 ~15 条需要 GSC 示例 URL 才能定名（见 .audit/variants/report.md）。
 *
 * 维护约定：
 * - 只加不删；映射目标必须是**当前存在且 200 的页面**（品牌/分类页从线上 sitemap 取）。
 * - 这里的规则由 next.config.mjs 的 redirects() 消费，返回 308（permanent），
 *   搜索引擎按 301 同等处理。
 */

const APEX = "https://quickeaseliftparts.com";

/** 旧品牌 slug → 最接近的新页面。未列入别名表的旧品牌一律回 /brands 列表。 */
const LEGACY_BRAND_ALIASES = {
  fujihd: "/brands/fuji",
  giantkone: "/brands/kone",
  "hitachi/guangri": "/brands/hitachi",
  "lg-sigma": "/brands/sigma",
  "lg-sigma-xizi-otis": "/brands/sigma",
  "sanyo-xj-schindler": "/brands/schindler",
  "sigma-tke": "/brands/sigma",
  "sigma/thyssenkrupp": "/brands/sigma",
  thyssenkrupp: "/brands/tke",
  "toshiba-/-fujitec": "/brands/toshiba",
  "xizi-otis": "/brands/otis",
  "xizi-forvorda": "/brands/other",
};

/**
 * 2026-08-02 迁移时被删掉/合并的旧品牌 slug（来自 git 历史，见
 * .audit/variants/analysis.txt）。全部实测线上 404。
 */
const LEGACY_BRAND_SLUGS = [
  "abb",
  "aodepu",
  "arkel",
  "astra",
  "autonics",
  "axxon-safe",
  "baumer",
  "bernstein",
  "bst",
  "cedes",
  "derin",
  "diro",
  "edunburgh",
  "ehc",
  "elco",
  "elgo",
  "emerson",
  "eshine",
  "fujihd",
  "giantkone",
  "guangri",
  "gustav-wolf",
  "heidenhain",
  "hengstler",
  "hitachi/guangri",
  "hohner",
  "hpmont",
  "hunter",
  "idec",
  "ife",
  "inovance",
  "keb",
  "kubler",
  "lg-sigma",
  "lg-sigma-xizi-otis",
  "ls",
  "mayr",
  "nbsl",
  "ningbo-xinda",
  "omron",
  "ouling",
  "panasonic",
  "qma",
  "sanei",
  "sanrex",
  "sanyo-xj-schindler",
  "schmersal",
  "schneider",
  "schrack",
  "selcom",
  "sematic",
  "sft",
  "shenghao",
  "siei",
  "siemens",
  "siemens-apt",
  "sigma-tke",
  "sigma/thyssenkrupp",
  "simider",
  "step",
  "sunny",
  "suns",
  "syney",
  "tamagawa",
  "tend",
  "thyssenkrupp",
  "tjsr",
  "tofi",
  "toshiba-/-fujitec",
  "turck",
  "vacon",
  "volks",
  "volkslift",
  "weco",
  "weton",
  "wittur",
  "xinda",
  "xizi-forvorda",
  "xizi-otis",
  "yaskawa",
];

/**
 * 旧分类 slug → 新页面。16 个 `elevator-pcb-*` + `kone-elevator-pcb` 当年都并入了
 * `elevator-pcb`；`otis`/`siemens` 是早期把品牌当分类的遗留；其余归到产品总列表。
 */
const LEGACY_CATEGORY_REDIRECTS = {
  "electrical-wholesaler": "/products",
  "elevator-pcb-blt-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-canny-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-fujitec-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-guangri-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-hitachi-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-hyundai-elevator-board": "/categories/elevator-pcb",
  "elevator-pcb-kone-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-mitsubishi-elevator-board": "/categories/elevator-pcb",
  "elevator-pcb-other-brand-pcb": "/categories/elevator-pcb",
  "elevator-pcb-otis-elevator-board": "/categories/elevator-pcb",
  "elevator-pcb-sigma-elevator-board": "/categories/elevator-pcb",
  "elevator-pcb-sjec-elevator-board": "/categories/elevator-pcb",
  "elevator-pcb-tke-elevator-board": "/categories/elevator-pcb",
  "elevator-pcb-toshiba-elevator-pcb": "/categories/elevator-pcb",
  "elevator-pcb-xiolift-pcb": "/categories/elevator-pcb",
  "kone-elevator-pcb": "/categories/elevator-pcb",
  "lift-equipment": "/products",
  otis: "/brands/otis",
  siemens: "/brands",
};

/** 旧路由 / 爬虫探测路径 */
const LEGACY_ROUTE_REDIRECTS = {
  "/quotation": "/contact",
  "/login": "/contact",
  "/register": "/contact",
  "/account": "/contact",
  "/index": "/",
  "/index.html": "/",
  "/sitemap": "/sitemap.xml",
  "/sitemap_index.xml": "/sitemap.xml",
  "/favicon.ico": "/favicon-32.png",
};

/** 静态路由的大写变体（Next 路径区分大小写，大写直接 404） */
const STATIC_CASE_REDIRECTS = {
  "/Products": "/products",
  "/Brands": "/brands",
  "/About": "/about",
  "/Knowledge": "/knowledge",
  "/Contact": "/contact",
  "/Search": "/search",
  "/Categories": "/products",
};

export function buildLegacyRedirects() {
  /** @type {{source:string,destination:string,permanent:boolean,has?:any[]}[]} */
  const redirects = [];

  // 1) www → apex（整站消掉一份 200 副本；GSC「备用网页 23」的主因）
  redirects.push({
    source: "/:path*",
    has: [{ type: "host", value: "www.quickeaseliftparts.com" }],
    destination: `${APEX}/:path*`,
    permanent: true,
  });

  // 2) /productss?view=brands 是「品牌列表」的另一份实现，规范地址是 /brands
  redirects.push({
    source: "/products",
    has: [{ type: "query", key: "view", value: "brands" }],
    destination: "/brands",
    permanent: true,
  });

  // 3) 旧路由
  for (const [source, destination] of Object.entries(LEGACY_ROUTE_REDIRECTS)) {
    redirects.push({ source, destination, permanent: true });
  }

  // 4) 旧分类 slug
  for (const [slug, destination] of Object.entries(LEGACY_CATEGORY_REDIRECTS)) {
    redirects.push({ source: `/categories/${slug}`, destination, permanent: true });
  }

  // 5) 旧品牌 slug（别名存在的给最接近的品牌页，其余回品牌列表）
  for (const slug of LEGACY_BRAND_SLUGS) {
    redirects.push({
      source: `/brands/${slug}`,
      destination: LEGACY_BRAND_ALIASES[slug] ?? "/brands",
      permanent: true,
    });
  }

  // 6) 静态路由大写变体（含子路径，如 /Products/ABC）
  for (const [source, destination] of Object.entries(STATIC_CASE_REDIRECTS)) {
    redirects.push({ source, destination, permanent: true });
    redirects.push({ source: `${source}/:path*`, destination: `${destination}/:path*`, permanent: true });
  }

  // 7) /categories 跳转壳：原来 307 两跳（/categories/ → 308 → /categories → 307 → /products）
  redirects.push({ source: "/categories", destination: "/products", permanent: true });
  redirects.push({ source: "/categories/", destination: "/products", permanent: true });

  return redirects;
}
