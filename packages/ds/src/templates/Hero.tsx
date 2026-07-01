import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Card } from "../core/Card.tsx";

export interface HeroCta {
  label: ReactNode;
  href: string;
}

export interface HeroCard {
  name: ReactNode;
  problem: ReactNode;
  href?: string;
  media?: ReactNode;
  className?: string;
}

export interface HeroProps {
  headline: ReactNode;
  subline?: ReactNode;
  ctas?: HeroCta[];
  cards: HeroCard[];
  overflow?: HeroCard[];
  overflowLabel?: ReactNode;
  "aria-label"?: string;
}

function renderCard(card: HeroCard, key: number) {
  const cardClassName = [
    "hero-band-card",
    card.className,
  ]
    .filter(Boolean)
    .join(" ");

  const contents = (
    <>
      {card.media !== undefined && (
        <span className="hero-band-card-media">{card.media}</span>
      )}
      <span className="hero-band-card-name">{card.name}</span>
      <p className="hero-band-card-problem">{card.problem}</p>
    </>
  );

  if (card.href !== undefined) {
    const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
      href: card.href,
    };
    return (
      <Card
        key={key}
        as="a"
        interactive
        className={cardClassName}
        {...anchorProps}
      >
        {contents}
      </Card>
    );
  }
  return (
    <Card key={key} className={cardClassName}>
      {contents}
    </Card>
  );
}

export function Hero(props: HeroProps) {
  const {
    headline,
    subline,
    ctas,
    cards,
    overflow,
    overflowLabel,
    "aria-label": ariaLabel,
  } = props;

  return (
    <section className="hero-band-section" aria-label={ariaLabel ?? "Featured"}>
      <div className="hero-band">
        <p className="hero-band-headline">{headline}</p>
        {subline !== undefined && (
          <p className="hero-band-subline">{subline}</p>
        )}
        {ctas && ctas.length > 0 && (
          <p className="hero-band-cta">
            {ctas.flatMap((cta, i) => {
              const link = (
                <a key={i} href={cta.href}>
                  {cta.label}
                </a>
              );
              if (i === 0) {
                return [link];
              }
              return [
                <span key={`sep-${i}`} aria-hidden="true">
                  {" · "}
                </span>,
                link,
              ];
            })}
          </p>
        )}
      </div>
      <div className="hero-band-grid">
        {cards.map((card, i) => renderCard(card, i))}
      </div>
      {overflow && overflow.length > 0 && (
        <details className="hero-band-overflow">
          <summary>{overflowLabel ?? "more…"}</summary>
          <div className="hero-band-grid">
            {overflow.map((card, i) => renderCard(card, i))}
          </div>
        </details>
      )}
    </section>
  );
}
