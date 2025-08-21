'use client';

import { useRef, type MouseEvent } from 'react';

type Props = {
  title?: string;
  linkHref?: string;
  imgSrc: string;
  imgAlt?: string;
  dataText?: string;
};

export default function ThreeDTiltCard({ title, linkHref, imgSrc, imgAlt = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onEnter() {
    const el = ref.current; if (!el) return;
    el.style.setProperty('--x', '0');
    el.style.setProperty('--y', '0');
  }
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    el.style.setProperty('--y', String(Math.round(-dx * 0.1))); // rotateY
    el.style.setProperty('--x', String(Math.round( dy * 0.1))); // rotateX
  }
  function onLeave() {
    const el = ref.current; if (!el) return;
    el.style.setProperty('--x', '0'); el.style.setProperty('--y', '0');
  }

  return (
    <div ref={ref} className="card" onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={onLeave}>
      <figure>
        <img src={imgSrc} alt={imgAlt} />
        {title && (
          <figcaption className="card-title">
            {linkHref ? <a className="card-link" href={linkHref}>{title}</a> : title}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
