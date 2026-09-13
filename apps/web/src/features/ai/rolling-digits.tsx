"use client";

import { useEffect, useState } from "react";

const ROLL_MS = 400;

export function RollingDigits({ value }: { value: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [oldVal, setOldVal] = useState(value);
  const [newVal, setNewVal] = useState(value);
  const [rolling, setRolling] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [dir, setDir] = useState<"up" | "down">("up");

  if (prevValue !== value) {
    const fromN = parseInt(prevValue, 10);
    const toN = parseInt(value, 10);
    setPrevValue(value);
    setDir(Number.isFinite(fromN) && Number.isFinite(toN) && toN < fromN ? "down" : "up");
    setOldVal(prevValue);
    setNewVal(value);
    setRolling(true);
    setShifted(false);
  }

  useEffect(() => {
    if (!rolling) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShifted(true));
    });
    const done = setTimeout(() => {
      setRolling(false);
      setOldVal(value);
      setShifted(false);
    }, ROLL_MS);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(done);
    };
  }, [rolling, value]);

  const chars = rolling ? newVal : oldVal;
  return (
    <>
      {Array.from({ length: chars.length }, (_, i) => {
        const o = oldVal[i] ?? "";
        const n = chars[i] ?? "";
        if (!rolling || o === n) return <span key={`${i}-${n}`}>{n}</span>;
        const top = dir === "down" ? n : o;
        const bottom = dir === "down" ? o : n;
        return (
          <span key={`${i}-${o}-${n}-${dir}`} style={{ display: "inline-block", position: "relative", overflow: "hidden", height: "1em", lineHeight: "1em", verticalAlign: "-0.05em" }}>
            <span style={{ display: "flex", flexDirection: "column", transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)", transform: `translateY(${shifted ? (dir === "down" ? "0" : "-1em") : dir === "down" ? "-1em" : "0"})` }}>
              <span style={{ height: "1em", lineHeight: "1em" }}>{top}</span>
              <span style={{ height: "1em", lineHeight: "1em" }}>{bottom}</span>
            </span>
          </span>
        );
      })}
    </>
  );
}

export default RollingDigits;
