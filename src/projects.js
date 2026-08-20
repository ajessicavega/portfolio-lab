function createProjectMedia(slug, title, slideCount, videoSlides = []) {
  const videoIndexes = new Set(videoSlides);

  return Array.from({ length: slideCount }, (_, index) => {
    const slideIndex = index + 1;
    const number = String(slideIndex).padStart(2, "0");
    const type = videoIndexes.has(slideIndex) ? "video" : "image";
    const src = `/projects/${slug}/${number}.${type === "video" ? "mp4" : "webp"}`;

    return type === "video"
      ? { type, src }
      : { type, src, alt: `${title} — slide ${number}` };
  });
}

export const projects = [
  {
    id: "outsider-school",
    eyebrow: "IDENTIDADE VISUAL",
    title: "Outsider School",
    year: "2024",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Identidade Visual & StyleGuide",
    description: "Desenvolvimento de identidade visual para a Escola de Negócios OutsiderSchool©, liderada por Bruno Gomes.",
    thumb: "/projects/outsider-school/thumb.webp",
    media: [
      { type: "image", src: "/projects/outsider-school/01.webp", alt: "Outsider School — slide 01" },
      { type: "video", src: "/projects/outsider-school/02.mp4" },
      { type: "image", src: "/projects/outsider-school/03.webp", alt: "Outsider School — slide 03" },
      { type: "image", src: "/projects/outsider-school/04.webp", alt: "Outsider School — slide 04" },
      { type: "image", src: "/projects/outsider-school/05.webp", alt: "Outsider School — slide 05" },
      { type: "video", src: "/projects/outsider-school/06.mp4" },
      { type: "video", src: "/projects/outsider-school/07.mp4" },
      { type: "image", src: "/projects/outsider-school/08.webp", alt: "Outsider School — slide 08" },
      { type: "image", src: "/projects/outsider-school/09.webp", alt: "Outsider School — slide 09" },
      { type: "video", src: "/projects/outsider-school/10.mp4" },
      { type: "video", src: "/projects/outsider-school/11.mp4" },
      { type: "video", src: "/projects/outsider-school/12.mp4" },
      { type: "video", src: "/projects/outsider-school/13.mp4" },
      { type: "image", src: "/projects/outsider-school/14.webp", alt: "Outsider School — slide 14" },
      { type: "video", src: "/projects/outsider-school/15.mp4" },
      { type: "image", src: "/projects/outsider-school/16.webp", alt: "Outsider School — slide 16" },
      { type: "image", src: "/projects/outsider-school/17.webp", alt: "Outsider School — slide 17" },
      { type: "image", src: "/projects/outsider-school/18.webp", alt: "Outsider School — slide 18" },
      { type: "image", src: "/projects/outsider-school/19.webp", alt: "Outsider School — slide 19" },
      { type: "image", src: "/projects/outsider-school/20.webp", alt: "Outsider School — slide 20" }
    ]
  },
  {
    id: "content-planner-2026",
    eyebrow: "PÁGINA DE VENDAS",
    title: "Content Planner 2026",
    year: "2025",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Página de Vendas & Assets",
    description: "Desenvolvimento de página de vendas para a marca Postar para Vender, liderada por Larissa Carlos.",
    thumb: "/projects/content-planner-2026/thumb.webp",
    media: createProjectMedia("content-planner-2026", "Content Planner 2026", 21, [4, 5])
  },
  {
    id: "pagina-chave",
    eyebrow: "KEY VISUAL E PÁGINA DE VENDAS",
    title: "Página Chave",
    year: "2025",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Key Visual & Página de Vendas",
    description: "Desenvolvimento de Key Visual e página de vendas para a Escola de Negócios OutsiderSchool©, liderada por Bruno Gomes.",
    thumb: "/projects/pagina-chave/thumb.webp",
    media: createProjectMedia("pagina-chave", "Página Chave", 20)
  },
  {
    id: "ricos-na-america",
    eyebrow: "PÁGINA DE VENDAS",
    title: "Ricos na América",
    year: "2023",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Página de Vendas & Key Visual",
    description: "Desenvolvimento de Key Visual e página de vendas para a marca Ricos na América, liderada por Verena Cordeiro.",
    thumb: "/projects/ricos-na-america/thumb.webp",
    media: createProjectMedia("ricos-na-america", "Ricos na América", 11)
  },
  {
    id: "pagina-funiss",
    eyebrow: "PÁGINA DE VENDAS",
    title: "Página Funiss",
    year: "2025",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Key Visual & Página de Vendas",
    description: "Desenvolvimento de Key Visual e página de vendas para a Escola de Negócios OutsiderSchool©, liderada por Bruno Gomes.",
    thumb: "/projects/pagina-funiss/thumb.webp",
    media: createProjectMedia("pagina-funiss", "Página Funiss", 12)
  },
  {
    id: "mqv-company",
    eyebrow: "IDENTIDADE VISUAL",
    title: "MQV Company",
    year: "2024",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Identidade Visual",
    description: "Desenvolvimento de identidade visual para a empresa MQV Company, liderada por Bruno Gomes e Larissa Carlos.",
    thumb: "/projects/mqv-company/thumb.webp",
    media: createProjectMedia("mqv-company", "MQV Company", 18, [8, 12, 14])
  },
  {
    id: "super-plano",
    eyebrow: "PÁGINA DE VENDAS",
    title: "Super Plano",
    year: "2023",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Key Visual & Página de Vendas",
    description: "Desenvolvimento de Key Visual e página de vendas para a marca Ricos na América, liderada por Verena Cordeiro.",
    thumb: "/projects/super-plano/thumb.webp",
    media: createProjectMedia("super-plano", "Super Plano", 9)
  },
  {
    id: "metodo-cip",
    eyebrow: "IDENTIDADE VISUAL",
    title: "Método CIP",
    year: "2023",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Identidade Visual",
    description: "Desenvolvimento de identidade visual para a marca Método CIP, liderada por Lisandra Zanuto.",
    thumb: "/projects/metodo-cip/thumb.webp",
    media: createProjectMedia("metodo-cip", "Método CIP", 31, [2, 15, 20])
  },
  {
    id: "pagina-livro",
    eyebrow: "PÁGINA DE VENDAS",
    title: "Página do Livro",
    year: "2023",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Key Visual & Página de Vendas",
    description: "Desenvolvimento de Key Visual e página de vendas para a Escola de Negócios OutsiderSchool©, liderada por Bruno Gomes.",
    thumb: "/projects/pagina-livro/thumb.webp",
    media: createProjectMedia("pagina-livro", "Página do Livro", 17)
  },
  {
    id: "laboratorio-contoterapia",
    eyebrow: "KEY VISUAL",
    title: "Laboratório de Contoterapia",
    year: "2023",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Key Visual & Criativos",
    description: "Desenvolvimento de Key Visual e criativos para a campanha Laboratório de Contoterapia, liderada por Lisandra Zanuto.",
    thumb: "/projects/laboratorio-contoterapia/thumb.webp",
    media: createProjectMedia("laboratorio-contoterapia", "Laboratório de Contoterapia", 8)
  },
  {
    id: "las-lobas",
    eyebrow: "IDENTIDADE VISUAL",
    title: "Las Lobas",
    year: "2023",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Identidade Visual",
    description: "Desenvolvimento de identidade visual para o grupo Las Lobas, liderado por Lisandra Zanuto.",
    thumb: "/projects/las-lobas/thumb.webp",
    media: createProjectMedia("las-lobas", "Las Lobas", 17, [2, 6, 9, 12, 15])
  },
  {
    id: "black-pass",
    eyebrow: "IDENTIDADE VISUAL",
    title: "Black Pass",
    year: "2025",
    secondaryLabel: "ENTREGUE",
    secondaryValue: "Identidade Visual & Páginas de Vendas",
    description: "Desenvolvimento de identidade visual e páginas de vendas para a campanha de Black Friday Black Pass, das marcas Postar para Vender e Outsider School, lideradas por Bruno Gomes e Larissa Carlos.",
    thumb: "/projects/black-pass/thumb.webp",
    media: createProjectMedia("black-pass", "Black Pass", 23, [2, 5, 6])
  }
];

const projectsById = new Map(projects.map((project) => [project.id, project]));
const resolveBase = (ids) => ids.map((id) => projectsById.get(id));

export const galleryBases = {
  A: resolveBase([
    "pagina-livro",
    "content-planner-2026",
    "ricos-na-america",
    "mqv-company",
    "outsider-school",
    "pagina-chave",
    "black-pass",
    "super-plano",
    "pagina-funiss"
  ]),
  B: resolveBase([
    "las-lobas",
    "pagina-funiss",
    "super-plano",
    "pagina-livro",
    "content-planner-2026",
    "ricos-na-america",
    "mqv-company",
    "metodo-cip",
    "laboratorio-contoterapia"
  ])
};
