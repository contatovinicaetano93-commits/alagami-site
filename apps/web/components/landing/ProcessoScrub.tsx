"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ObraCanvas = dynamic(() => import("./ObraCanvas"), { ssr: false });

const STEPS = [
  {
    n: "01",
    t: "Você nos conta o projeto",
    d: "Preencha o formulário. A equipe IMOBI retorna em até 24h para alinhar os próximos passos.",
    stage: "Terreno & briefing",
  },
  {
    n: "02",
    t: "Análise desburocratizada em tempo recorde",
    d: "Avaliamos viabilidade com processo simplificado. Proposta com taxa, prazo e condições em tempo recorde — sem burocracia desnecessária.",
    stage: "Fundação da operação",
  },
  {
    n: "03",
    t: "Garantias e modalidades caso a caso",
    d: "Volume, cronograma e garantias definidas com nosso modelo próprio — diferente do padrão de mercado. Tudo documentado e transparente.",
    stage: "Estrutura sobe",
  },
  {
    n: "04",
    t: "Capital no ritmo da obra",
    d: "Liberações conforme avanço físico validado por vistoria técnica. Você recebe quando a obra avança.",
    stage: "Entrega liberada",
  },
] as const;

type ProcessoScrubProps = {
  enable3d: boolean;
};

export function ProcessoScrub({ enable3d }: ProcessoScrubProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0.15);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const pinRange = el.offsetHeight - viewH;
      // Tall sections: scrub while pinned. Short sections (e.g. mobile):
      // map progress across the section traveling through the viewport.
      const total = pinRange > 0 ? pinRange : el.offsetHeight + viewH;
      const scrolled =
        pinRange > 0
          ? Math.min(Math.max(-rect.top, 0), total)
          : Math.min(Math.max(viewH - rect.top, 0), total);
      const p = scrolled / total;
      setProgress(0.1 + p * 0.85);
      setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length * 0.999)));
    }

    if (reduce) {
      setProgress(0.9);
      setActive(STEPS.length - 1);
      return;
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section className="como como-scrub" id="como" ref={sectionRef}>
<<<<<<< HEAD
      <div className="como-inner como-scrub-inner">
        <div className="como-head reveal">
          <p className="eyebrow como-ey">Processo</p>
          <h2 className="como-h2">
            Do pedido ao capital
            <br />
            <em>em dias, não meses.</em>
          </h2>
        </div>

        <div className="como-scrub-grid">
          <div className="como-scrub-sticky">
            {enable3d ? (
              <ObraCanvas
                progress={progress}
                className="como-3d-canvas"
                compact
              />
            ) : (
              <div className="como-3d-fallback" aria-hidden>
                <div className="como-3d-fallback-stack">
                  {STEPS.map((s, i) => (
                    <span
                      key={s.n}
                      className={`como-3d-fallback-bar${i <= active ? " on" : ""}`}
                      style={{ height: `${18 + i * 10}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className="como-scrub-stage">
              <span className="como-scrub-stage-n">{STEPS[active].n}</span>
              {STEPS[active].stage}
            </p>
            <div className="como-scrub-meter" aria-hidden>
              <div
                className="como-scrub-meter-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <div className="steps steps-scrub">
            <div className="steps-track" aria-hidden />
            {STEPS.map((s, i) => (
              <div
                className={`step scrub-step${i === active ? " active" : ""}${i < active ? " done" : ""}`}
                key={s.n}
              >
                <span className="step-n">{s.n}</span>
                <div>
                  <p className="step-t">{s.t}</p>
                  <p className="step-d">{s.d}</p>
=======
      <div className="como-scrub-pin">
        <div className="como-inner como-scrub-inner">
          <div className="como-head">
            <p className="eyebrow como-ey">Processo</p>
            <h2 className="como-h2">
              Do pedido ao capital
              <br />
              <em>em dias, não meses.</em>
            </h2>
          </div>

          <div className="como-scrub-grid">
            <div className="como-scrub-visual">
              {enable3d ? (
                <ObraCanvas progress={progress} className="como-3d-canvas" compact />
              ) : (
                <div className="como-3d-fallback" aria-hidden>
                  <div className="como-3d-fallback-stack">
                    {STEPS.map((s, i) => (
                      <span
                        key={s.n}
                        className={`como-3d-fallback-bar${i <= active ? " on" : ""}`}
                        style={{ height: `${18 + i * 10}%` }}
                      />
                    ))}
                  </div>
>>>>>>> d580e466 (fix(web): pin processo 3D+steps no viewport durante scrub)
                </div>
              )}
              <p className="como-scrub-stage">
                <span className="como-scrub-stage-n">{STEPS[active].n}</span>
                {STEPS[active].stage}
              </p>
              <div className="como-scrub-meter" aria-hidden>
                <div className="como-scrub-meter-fill" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>

            <div className="steps steps-scrub">
              {STEPS.map((s, i) => (
                <div
                  className={`step scrub-step${i === active ? " active" : ""}${i < active ? " done" : ""}`}
                  key={s.n}
                >
                  <span className="step-n">{s.n}</span>
                  <div>
                    <p className="step-t">{s.t}</p>
                    <p className="step-d">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
