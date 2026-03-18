// ============================================================
// DATA.JS — Dados importados do ACESSORIOS_2025.xlsx + modelo
// ============================================================

// Dados importados e normalizados da planilha
// Cada desconto tem: id, funcionario, produto, qtd, valor, pagamento, parcelas[], obs
const INITIAL_DATA = [
  {
    id: "d001", funcionario: "ANA REINA",
    produto: "MOTOROLA EDGE 60 5G FUSION 8/256 BLUE", qtd: 1,
    valor: 256.00, pagamento: "PARCELADO 2X",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 128.00, pago: true },
      { mes: 2, ano: 2026, label: "Fev/26", valor: 128.00, pago: true },
    ]
  },
  {
    id: "d002", funcionario: "ANA REINA",
    produto: "BODY SPLASH VICTORIA SECRET", qtd: 1,
    valor: 150.00, pagamento: "PARCELADO 2X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 75.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 75.00, pago: true },
    ]
  },
  {
    id: "d003", funcionario: "ANA CARVALHO",
    produto: "CARREGADORES 20W KD KN-108A KDPAN", qtd: 2,
    valor: 120.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 120.00, pago: true },
    ]
  },
  {
    id: "d004", funcionario: "ANA CARVALHO",
    produto: "HONOR X8B", qtd: 1,
    valor: 1329.00, pagamento: "PARCELADO 3X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 443.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 443.00, pago: false },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 443.00, pago: false },
    ]
  },
  {
    id: "d005", funcionario: "ANA CARVALHO",
    produto: "BODY SPLASH VICTORIA SECRET", qtd: 2,
    valor: 300.00, pagamento: "PARCELADO 2X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 150.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 150.00, pago: false },
    ]
  },
  {
    id: "d006", funcionario: "BEATRIZ GOMES",
    produto: "IPHONE 13 128GB LACRADO", qtd: 1,
    valor: 4450.00, pagamento: "PARCELADO 12X",
    parcelas: [
      { mes: 3,  ano: 2026, label: "Mar/26", valor: 370.83, pago: false },
      { mes: 4,  ano: 2026, label: "Abr/26", valor: 370.83, pago: false },
      { mes: 5,  ano: 2026, label: "Mai/26", valor: 370.83, pago: false },
      { mes: 6,  ano: 2026, label: "Jun/26", valor: 370.83, pago: false },
      { mes: 7,  ano: 2026, label: "Jul/26", valor: 370.83, pago: false },
      { mes: 8,  ano: 2026, label: "Ago/26", valor: 370.83, pago: false },
      { mes: 9,  ano: 2026, label: "Set/26", valor: 370.83, pago: false },
      { mes: 10, ano: 2026, label: "Out/26", valor: 370.83, pago: false },
      { mes: 11, ano: 2026, label: "Nov/26", valor: 370.83, pago: false },
      { mes: 12, ano: 2026, label: "Dez/26", valor: 370.83, pago: false },
      { mes: 1,  ano: 2027, label: "Jan/27", valor: 370.83, pago: false },
      { mes: 2,  ano: 2027, label: "Fev/27", valor: 370.87, pago: false },
    ]
  },
  {
    id: "d007", funcionario: "BEATRIZ GOMES",
    produto: "FONE BLUETOOTH KNC5603 KAIDI", qtd: 1,
    valor: 100.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d008", funcionario: "BEATRIZ GOMES",
    produto: "CARREGADOR 20W KD KN-108A KDPAN", qtd: 1,
    valor: 60.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 60.00, pago: true },
    ]
  },
  {
    id: "d009", funcionario: "BEATRIZ GOMES",
    produto: "BODY SPLASH VICTORIA SECRET", qtd: 2,
    valor: 300.00, pagamento: "PARCELADO 3X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 100.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 100.00, pago: true },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d010", funcionario: "BEATRIZ GOMES",
    produto: "FONE LENOVO XT83II", qtd: 1,
    valor: 150.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 150.00, pago: true },
    ]
  },
  {
    id: "d011", funcionario: "BEATRIZ GOMES",
    produto: "DESCONTO POR RECEBIMENTO INCORRETO", qtd: 1,
    valor: 179.85, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 179.85, pago: true },
    ]
  },
  {
    id: "d012", funcionario: "DAVISON",
    produto: "BODY SPLASH VICTORIA SECRET", qtd: 2,
    valor: 300.00, pagamento: "PARCELADO 3X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 100.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 100.00, pago: true },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d013", funcionario: "DAVISON",
    produto: "FONE LENOVO XT83II", qtd: 1,
    valor: 150.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 150.00, pago: true },
    ]
  },
  {
    id: "d014", funcionario: "DAVISON",
    produto: "POCO X7 PRO 5G", qtd: 1,
    valor: 3000.00, pagamento: "PARCELADO 12X",
    parcelas: [
      { mes: 3,  ano: 2026, label: "Mar/26", valor: 250.00, pago: true },
      { mes: 4,  ano: 2026, label: "Abr/26", valor: 250.00, pago: false },
      { mes: 5,  ano: 2026, label: "Mai/26", valor: 250.00, pago: false },
      { mes: 6,  ano: 2026, label: "Jun/26", valor: 250.00, pago: false },
      { mes: 7,  ano: 2026, label: "Jul/26", valor: 250.00, pago: false },
      { mes: 8,  ano: 2026, label: "Ago/26", valor: 250.00, pago: false },
      { mes: 9,  ano: 2026, label: "Set/26", valor: 250.00, pago: false },
      { mes: 10, ano: 2026, label: "Out/26", valor: 250.00, pago: false },
      { mes: 11, ano: 2026, label: "Nov/26", valor: 250.00, pago: false },
      { mes: 12, ano: 2026, label: "Dez/26", valor: 250.00, pago: false },
      { mes: 1,  ano: 2027, label: "Jan/27", valor: 250.00, pago: false },
      { mes: 2,  ano: 2027, label: "Fev/27", valor: 250.00, pago: false },
    ]
  },
  {
    id: "d015", funcionario: "FABIANA",
    produto: "ENTRADA X7C (06/01) COBRANÇA ERRADA", qtd: 1,
    valor: 251.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 251.00, pago: true },
    ]
  },
  {
    id: "d016", funcionario: "FABIANA",
    produto: "FONE BLUETOOTH KNC5602 KAIDI", qtd: 1,
    valor: 100.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d017", funcionario: "FABIANA",
    produto: "FONE BLUETOOTH KNC5603 KAIDI", qtd: 1,
    valor: 100.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d018", funcionario: "FABIANA",
    produto: "CABO DE DADOS SJX15-3 H'MASTON", qtd: 1,
    valor: 25.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 25.00, pago: true },
    ]
  },
  {
    id: "d019", funcionario: "FABIANA",
    produto: "FONE BLUETOOTH KNC5603 KAIDI", qtd: 1,
    valor: 100.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d020", funcionario: "FABIANA",
    produto: "CAPA POCO X4 PRO", qtd: 1,
    valor: 20.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 20.00, pago: true },
    ]
  },
  {
    id: "d021", funcionario: "FILIPE",
    produto: "TROCA TELA IPHONE 15 PRO MAX", qtd: 1,
    valor: 2500.00, pagamento: "PARCELADO 10X",
    parcelas: [
      { mes: 11, ano: 2025, label: "Nov/25", valor: 250.00, pago: true },
      { mes: 12, ano: 2025, label: "Dez/25", valor: 250.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 250.00, pago: true },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 250.00, pago: true },
      { mes: 3,  ano: 2026, label: "Mar/26", valor: 250.00, pago: false },
      { mes: 4,  ano: 2026, label: "Abr/26", valor: 250.00, pago: false },
      { mes: 5,  ano: 2026, label: "Mai/26", valor: 250.00, pago: false },
      { mes: 6,  ano: 2026, label: "Jun/26", valor: 250.00, pago: false },
      { mes: 7,  ano: 2026, label: "Jul/26", valor: 250.00, pago: false },
      { mes: 8,  ano: 2026, label: "Ago/26", valor: 250.00, pago: false },
    ]
  },
  {
    id: "d022", funcionario: "FILIPE",
    produto: "PELICULA FOSCA HYDROGEL SUPER PREMIUM", qtd: 1,
    valor: 70.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 70.00, pago: true },
    ]
  },
  {
    id: "d023", funcionario: "KEMILYN",
    produto: "FONE BLUETOOTH REALFIT F2", qtd: 1,
    valor: 100.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 3, ano: 2026, label: "Mar/26", valor: 100.00, pago: false },
    ]
  },
  {
    id: "d024", funcionario: "KEMILYN",
    produto: "CABO KD 306 KAIDI", qtd: 1,
    valor: 30.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 30.00, pago: true },
    ]
  },
  {
    id: "d025", funcionario: "KEMILYN",
    produto: "PELICULA PRIVACIDADE HYDROGEL SUPER PREMIUM", qtd: 1,
    valor: 80.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 80.00, pago: true },
    ]
  },
  {
    id: "d026", funcionario: "KEMILYN",
    produto: "CAPA IPHONE 17 PRO", qtd: 1,
    valor: 70.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 70.00, pago: true },
    ]
  },
  {
    id: "d027", funcionario: "KEMILYN",
    produto: "DIFERENÇA HOLERITE", qtd: 1,
    valor: 56.48, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 1, ano: 2026, label: "Jan/26", valor: 56.48, pago: true },
    ]
  },
  {
    id: "d028", funcionario: "KEMILYN",
    produto: "BODY SPLASH VICTORIA SECRET", qtd: 2,
    valor: 300.00, pagamento: "PARCELADO 2X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 150.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 150.00, pago: true },
    ]
  },
  {
    id: "d029", funcionario: "KEMILYN",
    produto: "CARREGADOR 20W ESSAGER COMPLETO IPHONE", qtd: 1,
    valor: 70.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 70.00, pago: true },
    ]
  },
  {
    id: "d030", funcionario: "KEMILYN",
    produto: "IPHONE 13 PRO MAX", qtd: 1,
    valor: 800.00, pagamento: "PARCELADO 2X",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 400.00, pago: true },
      { mes: 3, ano: 2026, label: "Mar/26", valor: 400.00, pago: false },
    ]
  },
  {
    id: "d031", funcionario: "BIGODE",
    produto: "MOTO E22 AZUL 4/128 (SEMINOVO)", qtd: 1,
    valor: 400.00, pagamento: "PARCELADO 4X",
    parcelas: [
      { mes: 3, ano: 2026, label: "Mar/26", valor: 100.00, pago: false },
      { mes: 4, ano: 2026, label: "Abr/26", valor: 100.00, pago: false },
      { mes: 5, ano: 2026, label: "Mai/26", valor: 100.00, pago: false },
      { mes: 6, ano: 2026, label: "Jun/26", valor: 100.00, pago: false },
    ]
  },
  {
    id: "d032", funcionario: "BIGODE",
    produto: "REDMI A5 4/128 VERDE + PELICULA HD HYDROGEL STANDARD", qtd: 1,
    valor: 1260.00, pagamento: "PARCELADO",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 100.00, pago: true },
      { mes: 3, ano: 2026, label: "Mar/26", valor: 50.00,  pago: true },
    ]
  },
  {
    id: "d033", funcionario: "BIGODE",
    produto: "CHIP CLARO PREZÃO", qtd: 1,
    valor: 30.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 30.00, pago: true },
    ]
  },
  {
    id: "d034", funcionario: "BIGODE",
    produto: "CELULAR", qtd: 1,
    valor: 300.00, pagamento: "PARCELADO 3X",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 100.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 100.00, pago: true },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d035", funcionario: "POLLYANA",
    produto: "HONOR MAGIC 7 LITE 5G 8/256 PURPLE", qtd: 1,
    valor: 3000.00, pagamento: "PARCELADO 10X",
    parcelas: [
      { mes: 11, ano: 2025, label: "Nov/25", valor: 300.00, pago: true },
      { mes: 12, ano: 2025, label: "Dez/25", valor: 300.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 300.00, pago: true },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 300.00, pago: true },
      { mes: 3,  ano: 2026, label: "Mar/26", valor: 300.00, pago: false },
      { mes: 4,  ano: 2026, label: "Abr/26", valor: 300.00, pago: false },
      { mes: 5,  ano: 2026, label: "Mai/26", valor: 300.00, pago: false },
      { mes: 6,  ano: 2026, label: "Jun/26", valor: 300.00, pago: false },
      { mes: 7,  ano: 2026, label: "Jul/26", valor: 300.00, pago: false },
      { mes: 8,  ano: 2026, label: "Ago/26", valor: 300.00, pago: false },
    ]
  },
  {
    id: "d036", funcionario: "DIOGO",
    produto: "PELICULA HD HYDROGEL PREMIUM", qtd: 1,
    valor: 60.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 60.00, pago: true },
    ]
  },
  {
    id: "d037", funcionario: "SABRINA",
    produto: "IPHONE 16 PRO MAX", qtd: 1,
    valor: 8700.00, pagamento: "PARCELADO 19+1X (DIA 25)",
    parcelas: [
      { mes: 12, ano: 2025, label: "Dez/25", valor: 450.00, pago: true },
      { mes: 1,  ano: 2026, label: "Jan/26", valor: 450.00, pago: true },
      { mes: 2,  ano: 2026, label: "Fev/26", valor: 450.00, pago: true },
      { mes: 3,  ano: 2026, label: "Mar/26", valor: 450.00, pago: false },
      { mes: 4,  ano: 2026, label: "Abr/26", valor: 450.00, pago: false },
      { mes: 5,  ano: 2026, label: "Mai/26", valor: 450.00, pago: false },
      { mes: 6,  ano: 2026, label: "Jun/26", valor: 450.00, pago: false },
      { mes: 7,  ano: 2026, label: "Jul/26", valor: 450.00, pago: false },
      { mes: 8,  ano: 2026, label: "Ago/26", valor: 450.00, pago: false },
      { mes: 9,  ano: 2026, label: "Set/26", valor: 450.00, pago: false },
      { mes: 10, ano: 2026, label: "Out/26", valor: 450.00, pago: false },
      { mes: 11, ano: 2026, label: "Nov/26", valor: 450.00, pago: false },
      { mes: 12, ano: 2026, label: "Dez/26", valor: 450.00, pago: false },
      { mes: 1,  ano: 2027, label: "Jan/27", valor: 450.00, pago: false },
      { mes: 2,  ano: 2027, label: "Fev/27", valor: 450.00, pago: false },
    ]
  },
  {
    id: "d038", funcionario: "PAULINHA",
    produto: "FONE ESTÉREO KD 799 KAIDI BRANCO", qtd: 1,
    valor: 100.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 100.00, pago: true },
    ]
  },
  {
    id: "d039", funcionario: "PAULINHA",
    produto: "FONE BLUETOOTH LENOVO THINKPLUS XT83II", qtd: 1,
    valor: 150.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 2, ano: 2026, label: "Fev/26", valor: 150.00, pago: true },
    ]
  },
  {
    id: "d040", funcionario: "PAULINHA",
    produto: "FONE BLUETOOTH BASEUS BOWIE E16 PRETO", qtd: 1,
    valor: 180.00, pagamento: "PARCELADO 2X",
    parcelas: [
      { mes: 3, ano: 2026, label: "Mar/26", valor: 90.00, pago: false },
      { mes: 4, ano: 2026, label: "Abr/26", valor: 90.00, pago: false },
    ]
  },
  {
    id: "d041", funcionario: "PAULINHA",
    produto: "PELICULA HD HYDROGEL PREMIUM", qtd: 1,
    valor: 80.00, pagamento: "INTEGRAL",
    parcelas: [
      { mes: 3, ano: 2026, label: "Mar/26", valor: 80.00, pago: false },
    ]
  },
];
