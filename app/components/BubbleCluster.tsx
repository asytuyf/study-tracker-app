"use client";

interface Bubble {
    size: number;      // px
    top: string;
    left?: string;
    right?: string;
    delay: string;
}

const BUBBLES: Bubble[] = [
    { size: 180, top: "10%", left: "50%", delay: "0s" },
    { size: 90, top: "5%", left: "30%", delay: "-4s" },
    { size: 80, top: "15%", right: "10%", delay: "-6s" },
    { size: 60, top: "55%", left: "20%", delay: "-3s" },
    { size: 100, top: "65%", right: "15%", delay: "-5s" },
];

function BubbleOrb({ size, top, left, right, delay }: Bubble) {
    return (
        <div
            className="bubble absolute"
            style={{
                width: size,
                height: size,
                top,
                ...(left ? { left } : {}),
                ...(right ? { right } : {}),
                animationDelay: delay,
                transform: "translate(-50%, 0)",
            }}
        >
            <span /><span /><span /><span /><span />
        </div>
    );
}

export default function BubbleCluster({ side }: { side: "left" | "right" }) {
    return (
        <div
            className="fixed top-0 bottom-0 w-72 pointer-events-none select-none z-0 hidden xl:block"
            style={{ [side]: 0 }}
        >
            {BUBBLES.map((b, i) => (
                <BubbleOrb key={i} {...b} />
            ))}
        </div>
    );
}
