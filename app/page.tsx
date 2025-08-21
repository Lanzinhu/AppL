'use client';

import ThreeDTiltCard from './components/ThreeDTiltCard';

type Card = {
  title: string;
  linkHref: string;
  imgSrc: string;
  imgAlt: string;
};

const cards: Card[] = [
  {
    title: 'PlanUp (Tarefas)',
    linkHref: '/tasks',
    imgSrc: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?q=85',
    imgAlt: 'PlanUp',
  },
  {
    title: 'Configurações',
    linkHref: '/settings', // submenu em cards (Unidades/Categorias)
    imgSrc: 'https://images.unsplash.com/photo-1575396574188-ccf23d32d4b8?crop=entropy&cs=srgb&fm=jpg&q=85',
    imgAlt: 'Configurações do sistema',
  },
  {
    title: 'Produtos',
    linkHref: '/products',
    imgSrc: 'https://images.unsplash.com/photo-1541976590-713941681591?q=85',
    imgAlt: 'Gestão de produtos',
  },
  {
    title: 'Parceiros',
    linkHref: '/partners',
    imgSrc: 'https://images.unsplash.com/photo-1523958203904-cdcb402031fd?q=85',
    imgAlt: 'Clientes e fornecedores',
  },
  {
    title: 'Estoque',
    linkHref: '/stock',
    imgSrc: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=85',
    imgAlt: 'Movimentações e lotes',
  },
  {
    title: 'Unidades & Categorias',
    linkHref: '/settings/units',
    imgSrc: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=85',
    imgAlt: 'Cadastros básicos',
  },
];

export default function Home() {
  return (
    <main className="main-tilt mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Tasker ERP</h1>
        <p className="text-sm text-gray-600">Escolha um módulo para começar</p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <ThreeDTiltCard key={c.linkHref} {...c} />
        ))}
      </section>
    </main>
  );
}
