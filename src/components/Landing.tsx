import { disclaimer } from "@/lib/copy";

interface LandingProps {
  onStart: () => void;
  onExample: () => void;
}

export function Landing({ onStart, onExample }: LandingProps) {
  return (
    <section className="space-y-8 rounded-[2rem] border border-white/15 bg-white/5 p-8 shadow-glow backdrop-blur">
      <p className="text-sm tracking-[0.2em] text-blue">LifeFork / 人生岔路</p>
      <h1 className="text-3xl font-semibold leading-relaxed md:text-5xl">
        你一直在变化。<br />像一条正在分岔的河流。
      </h1>
      <p className="max-w-3xl text-mist">
        LifeFork 会把你的记忆、选择、恐惧、愿望和语言，整理成一个可以对话的 Self Skill。然后，你可以见到过去的你、未来的你，以及那些你没有选择的人生里的你。
      </p>
      <div className="flex flex-wrap gap-4">
        <button className="rounded-full bg-gradient-to-r from-gold to-violet px-6 py-3 text-night" onClick={onStart}>
          开始见未来的我
        </button>
        <button className="rounded-full border border-white/25 px-6 py-3 text-ink" onClick={onExample}>
          查看示例体验
        </button>
      </div>
      <p className="text-xs text-mist/90">{disclaimer}</p>
    </section>
  );
}
