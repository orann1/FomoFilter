// S&P 500 static fallback symbol list.
//
// Source strategy:
//   FMP /stable/sp500-constituent returns HTTP 402 on the current plan.
//   This list is manually curated based on known S&P 500 composition as of mid-2025.
//   Symbols are cross-referenced against publicly available index documentation.
//
// Notes:
//   BRK.B is used (Berkshire Hathaway Class B) — the standard S&P 500 member.
//   GOOG and GOOGL are both included (Alphabet Class C and Class A).
//   FOXA and FOX are both included (Fox Corporation Class A and Class B).
//   NWSA and NWS are both included (News Corp Class A and Class B).
//   RVTY is the current ticker for Revvity Inc. (formerly PerkinElmer / PKI, renamed 2023).
//   DAY is the current ticker for Dayforce Inc. (formerly Ceridian HCM / CDAY, renamed 2024).
//   GEV (GE Vernova) and GEHC (GE HealthCare) are both included — GE spinoffs added in 2024 and 2023.
//   KVUE (Kenvue) was spun off from JNJ in 2023 and added to S&P 500.
//   SOLV (Solventum) was spun off from MMM in 2024 and added to S&P 500.
//   Symbols removed due to acquisitions or delistings completed before mid-2025:
//     HES (Hess — acquired by Chevron), MRO (Marathon Oil — acquired by ConocoPhillips),
//     K (Kellanova — acquired by Mars), WBA (Walgreens — went private),
//     JNPR (Juniper Networks — acquired by HPE).
//   Non-US-domiciled companies excluded even if listed on US exchanges (ASML, MELI, ARM, etc.).
//
// Update this list when quarterly rebalancing occurs.

export const SP500_FALLBACK_METADATA = {
  source: "static_fallback",
  provider: "manual",
  index: "sp-500",
  compositionAsOf: "2025-07-01",
  lastVerifiedAt: "2026-06-05",
  symbolCount: 499,
  notes:
    "FMP /stable/sp500-constituent returns HTTP 402 on current plan. Symbol list manually curated from known S&P 500 composition as of mid-2025. BRK.B (Berkshire Hathaway B) uses period notation per FMP standard. Acquired companies removed: HES (Chevron deal), MRO (ConocoPhillips deal), K (Mars deal), WBA (went private), JNPR (HPE deal). Non-US-domiciled stocks excluded (ASML, MELI, ARM, etc.). Spinoffs added: KVUE (from JNJ), SOLV (from MMM), GEV (from GE), GEHC (from GE), VLTO (from DHR). Renamed tickers: RVTY (was PKI/PerkinElmer), DAY (was CDAY/Ceridian).",
} as const;

export const SP500_SYMBOLS: ReadonlyArray<string> = [
  // A
  "A",    "AAPL", "ABBV", "ABNB", "ABT",  "ACGL", "ACN",  "ADBE", "ADI",  "ADM",
  "ADP",  "ADSK", "AEE",  "AEP",  "AES",  "AFL",  "AIG",  "AIZ",  "AJG",  "AKAM",
  "ALB",  "ALGN", "ALK",  "ALL",  "ALLE", "ALLY", "ALNY", "AMAT", "AMCR", "AMD",
  "AME",  "AMGN", "AMP",  "AMT",  "AMZN", "ANET", "ANSS", "AON",  "AOS",  "APA",
  "APD",  "APH",  "APP",  "APTV", "ARE",  "ARES", "ATO",  "AVGO", "AVB",  "AVY",
  "AVTR", "AWK",  "AXON", "AXP",  "AXTA", "AZO",
  // B
  "BA",   "BAC",  "BAH",  "BALL", "BAX",  "BBWI", "BBY",  "BDX",  "BEN",  "BG",
  "BIIB", "BK",   "BKNG", "BKR",  "BLK",  "BLDR", "BMY",  "BR",   "BRK.B","BSX",
  "BWA",  "BXP",
  // C
  "C",    "CAG",  "CAH",  "CARR", "CAT",  "CB",   "CBOE", "CBRE", "CCI",  "CCL",
  "CDNS", "CDW",  "CE",   "CEG",  "CF",   "CFG",  "CG",   "CHD",  "CHRW", "CHTR",
  "CI",   "CINF", "CL",   "CLF",  "CLX",  "CMA",  "CMCSA","CME",  "CMG",  "CMI",
  "CMS",  "CNC",  "CNP",  "COF",  "COO",  "COP",  "COST", "CPB",  "CPT",  "CRL",
  "CRM",  "CSCO", "CSGP", "CSX",  "CTAS", "CTSH", "CTRA", "CTVA", "CVS",  "CVX",
  // D
  "D",    "DAL",  "DASH", "DAY",  "DDOG", "DE",   "DECK", "DELL", "DFS",  "DG",
  "DGX",  "DHI",  "DHR",  "DIS",  "DLR",  "DLTR", "DOC",  "DOV",  "DOW",  "DPZ",
  "DRI",  "DTE",  "DUK",  "DVA",  "DVN",  "DXCM",
  // E
  "EA",   "EBAY", "ECL",  "ED",   "EFX",  "EG",   "EIX",  "EL",   "ELV",  "EMN",
  "EMR",  "ENPH", "EOG",  "EPAM", "EQIX", "EQR",  "EQT",  "ES",   "ESS",  "ETN",
  "ETR",  "ETSY", "EVRG", "EW",   "EXC",  "EXPD", "EXPE", "EXR",
  // F
  "F",    "FANG", "FAST", "FBIN", "FCX",  "FDS",  "FDX",  "FE",   "FFIV", "FI",
  "FIS",  "FITB", "FIVE", "FMC",  "FOX",  "FOXA", "FRT",  "FSLR", "FTNT", "FTV",
  // G
  "GD",   "GDDY", "GE",   "GEHC", "GEN",  "GEV",  "GFS",  "GILD", "GIS",  "GL",
  "GLW",  "GM",   "GNRC", "GOOG", "GOOGL","GPC",  "GPN",  "GRMN", "GS",   "GWW",
  // H
  "HAL",  "HAS",  "HBAN", "HCA",  "HD",   "HIG",  "HII",  "HLT",  "HOLX", "HON",
  "HPE",  "HPQ",  "HRL",  "HSIC", "HST",  "HSY",  "HUBB", "HUM",  "HWM",
  // I
  "IBM",  "ICE",  "IDXX", "IEX",  "IFF",  "ILMN", "INCY", "INTC", "INTU", "INVH",
  "IP",   "IPG",  "IQV",  "IR",   "IRM",  "ISRG", "IT",   "ITW",  "IVZ",
  // J
  "J",    "JBHT", "JBL",  "JCI",  "JKHY", "JNJ",  "JPM",
  // K
  "KDP",  "KEY",  "KEYS", "KHC",  "KIM",  "KKR",  "KLAC", "KMB",  "KMI",  "KMX",
  "KO",   "KR",   "KVUE",
  // L
  "L",    "LDOS", "LEN",  "LH",   "LHX",  "LIN",  "LKQ",  "LLY",  "LMT",  "LNT",
  "LOW",  "LRCX", "LULU", "LUV",  "LVS",  "LW",   "LYB",  "LYV",
  // M
  "MA",   "MAA",  "MAR",  "MAS",  "MCD",  "MCHP", "MCK",  "MCO",  "MDLZ", "MDT",
  "MET",  "META", "MGM",  "MHK",  "MKC",  "MKTX", "MLM",  "MMC",  "MMM",  "MNST",
  "MO",   "MOH",  "MOS",  "MPC",  "MPWR", "MRK",  "MRNA", "MS",   "MSCI", "MSFT",
  "MSI",  "MTB",  "MTD",  "MU",
  // N
  "NDAQ", "NEE",  "NEM",  "NFLX", "NI",   "NKE",  "NOC",  "NOW",  "NRG",  "NTAP",
  "NTRS", "NUE",  "NVDA", "NVR",  "NVT",  "NWS",  "NWSA",
  // O
  "O",    "ODFL", "OC",   "OKE",  "OMC",  "ON",   "ORCL", "ORLY", "OTIS", "OXY",
  // P
  "PANW", "PARA", "PAYC", "PAYX", "PCAR", "PCG",  "PEG",  "PEP",  "PFE",  "PFG",
  "PG",   "PGR",  "PH",   "PHM",  "PKG",  "PLD",  "PLTR", "PM",   "PNC",  "PNR",
  "PNW",  "PODD", "POOL", "PPG",  "PPL",  "PRU",  "PSA",  "PSX",  "PTC",  "PWR",
  "PYPL",
  // Q
  "QCOM", "QRVO",
  // R
  "RCL",  "REG",  "REGN", "RF",   "RJF",  "RL",   "RMD",  "ROK",  "ROL",  "ROP",
  "ROST", "RSG",  "RTX",  "RVTY",
  // S
  "SBAC", "SBUX", "SCHW", "SHW",  "SJM",  "SLB",  "SMCI", "SNA",  "SNPS", "SO",
  "SOLV", "SPG",  "SRE",  "STE",  "STT",  "STLD", "STX",  "STZ",  "SWK",  "SWKS",
  "SYF",  "SYK",  "SYY",
  // T
  "T",    "TAP",  "TDG",  "TDY",  "TECH", "TEL",  "TER",  "TFC",  "TFX",  "TGT",
  "TJX",  "TMO",  "TMUS", "TPL",  "TPR",  "TRGP", "TRV",  "TSCO", "TSLA", "TSN",
  "TT",   "TTWO", "TXN",  "TXRH", "TXT",  "TYL",
  // U
  "UAL",  "UBER", "UDR",  "UHS",  "ULTA", "UNH",  "UNP",  "UPS",  "URI",  "USB",
  // V
  "V",    "VICI", "VLO",  "VLTO", "VMC",  "VRSK", "VRT",  "VRTX", "VST",  "VTR",
  "VTRS", "VZ",
  // W
  "WAB",  "WAT",  "WBD",  "WDC",  "WEC",  "WELL", "WFC",  "WM",   "WMB",  "WMT",
  "WRB",  "WST",  "WTW",  "WY",   "WYNN",
  // X
  "XEL",  "XOM",  "XYL",
  // Y
  "YUM",
  // Z
  "ZBH",  "ZBRA", "ZTS",
];
