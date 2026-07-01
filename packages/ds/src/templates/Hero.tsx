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
}

export interface HeroProps {
  headline: ReactNode;
  subline?: ReactNode;
  ctas?: HeroCta[];
  cards: HeroCard[];
  "aria-label"?: string;
}

export function Hero(props: HeroProps) {
  const { headline, subline, ctas, cards, "aria-label": ariaLabel } = props;

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
        {cards.map((card, i) => {
          if (card.href !== undefined) {
            const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = {
              href: card.href,
            };
            return (
              <Card
                key={i}
                as="a"
                interactive
                className="hero-band-card"
                {...anchorProps}
              >
                <span className="hero-band-card-name">{card.name}</span>
                <p className="hero-band-card-problem">{card.problem}</p>
              </Card>
            );
          }
          return (
            <Card key={i} className="hero-band-card">
              <span className="hero-band-card-name">{card.name}</span>
              <p className="hero-band-card-problem">{card.problem}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
