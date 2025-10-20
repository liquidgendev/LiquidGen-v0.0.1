/*
LiquidGen Landing Page - Single-file React component
- Uses Tailwind CSS classes for styling
- Uses recharts for the yield/buyback chart
- Uses framer-motion for small interactions

Features included:
- Hero with water/liquid theme
- Interactive calculator with the user's example pre-filled:
  * $10,000,000 locked, 20% avg APR, 15 buybacks/month
- Shows: annual yield, monthly yield, yield per buyback, LQ burn calculations
- Vote allocation input for buybacks among up to 3 projects
- A simulated schedule of randomized buybacks across a month and their sizes
- Exportable summary (copy to clipboard button)

How the underlying model (encoded in the component) works:
- `lockedValue` = total USD value of locked LP positions
- `apr` = average APR earned by locked assets (annual)
- `platformFeePct` = percent of yield allocated to platform operations (optional)
- `buybackAllocationPct` = percent of yield allocated to buybacks and burns (rest goes to LP rewards, vaults, etc.)
- Monthly yield = lockedValue * (apr / 12)
- Amount per month earmarked for buybacks = monthlyYield * buybackAllocationPct
- Amount per buyback = earmarkedBuybackAmount / buybacksPerMonth
- If LQ is paired and burned on buybacks, we simulate a burn rate: for every $X spent on buyback, Y% of LQ supply is burned (configurable by user)

Note: This is a front-end demo + calculator for the landing page. Integrations (on-chain interactions, real-time price oracles, swap routing, wallet connections) are out-of-scope for this single-file demo but are annotated where they'd be implemented.
*/

import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function LiquidGenLanding() {
  // --- default example values provided by the user ---
  const [lockedValue, setLockedValue] = useState(10000000); // $10,000,000
  const [apr, setApr] = useState(20); // 20% APR
  const [buybacksPerMonth, setBuybacksPerMonth] = useState(15);
  const [buybackAllocationPct, setBuybackAllocationPct] = useState(0.9); // 90% of yield goes to buybacks/burns
  const [platformFeePct, setPlatformFeePct] = useState(0.02); // 2% platform operations fee (of yield)
  const [lqBurnRatePct, setLqBurnRatePct] = useState(1); // 1% of LQ supply burned per $100k of buybacks (simulated metric)

  const [allocA, setAllocA] = useState(60);
  const [allocB, setAllocB] = useState(30);
  const [allocC, setAllocC] = useState(10);

  // helper formatting
  const fmt = (v) => {
    return v >= 1 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toFixed(6);
  };

  // --- core calculations ---
  const results = useMemo(() => {
    const annualYield = lockedValue * (apr / 100);
    const monthlyYield = annualYield / 12;
    const yieldAfterPlatformFee = monthlyYield * (1 - platformFeePct);
    const buybackPool = yieldAfterPlatformFee * buybackAllocationPct;
    const perBuyback = buybackPool / Math.max(1, buybacksPerMonth);

    // Allocation among voted projects
    const allocSum = Math.max(1, allocA + allocB + allocC);
    const alloc = {
      A: (allocA / allocSum) * buybackPool,
      B: (allocB / allocSum) * buybackPool,
      C: (allocC / allocSum) * buybackPool,
    };

    // Simulate LQ burn as simple function: burnedLqUnits = (buybackPool / 100000) * (lqBurnRatePct)
    // This is a DEMO metric; on-chain burn would depend on LQ price & mechanism
    const burnedLqUnits = (buybackPool / 100000) * (lqBurnRatePct);

    return {
      annualYield,
      monthlyYield,
      yieldAfterPlatformFee,
      buybackPool,
      perBuyback,
      alloc,
      burnedLqUnits,
    };
  }, [lockedValue, apr, buybacksPerMonth, buybackAllocationPct, platformFeePct, allocA, allocB, allocC, lqBurnRatePct]);

  // Build a small dataset of buybacks over 30 days with slight randomization
  const buybackSchedule = useMemo(() => {
    const days = 30;
    const arr = [];
    let remaining = results.buybackPool;
    for (let i = 0; i < days; i++) {
      // randomly decide whether a buyback happens that day (probability scaled to meet buybacksPerMonth)
      const prob = buybacksPerMonth / 30;
      const happens = Math.random() < prob;
      let amt = 0;
      if (happens) {
        // randomize around perBuyback ±30%
        const jitter = 1 + (Math.random() - 0.5) * 0.6;
        amt = Math.max(0, Math.min(remaining, results.perBuyback * jitter));
        remaining -= amt;
      }
      arr.push({ day: i + 1, amount: Math.round(amt) });
    }
    // If rounding left some remainder, add it to the last day
    if (remaining > 0) {
      arr[arr.length - 1].amount += Math.round(remaining);
    }
    return arr;
  }, [results, buybacksPerMonth]);

  const chartData = buybackSchedule.map((d) => ({ name: `D${d.day}`, amount: d.amount }));

  const copySummary = async () => {
    const text = `LiquidGen summary:\nLocked: $${fmt(lockedValue)}\nAPR: ${fmt(apr)}%\nMonthly yield: $${fmt(results.monthlyYield)}\nBuyback pool/month: $${fmt(results.buybackPool)}\nPer buyback (avg): $${fmt(results.perBuyback)}\nAllocations: A $${fmt(results.alloc.A)}, B $${fmt(results.alloc.B)}, C $${fmt(results.alloc.C)}\nSimulated LQ burned (units): ${fmt(results.burnedLqUnits)}`;
    await navigator.clipboard.writeText(text);
    alert("Summary copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50 to-white p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between py-8">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900">LiquidGen</h1>
          <p className="mt-1 text-slate-600">Turn LP yield into buybacks for new launches — $LQ + $SOL on Solana</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-sky-600 text-white rounded-lg shadow">Connect Wallet</button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg">Docs</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hero / Pitch */}
        <section className="lg:col-span-2 rounded-2xl p-8 bg-white/60 backdrop-blur border border-slate-100 shadow">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold">All-in-one DeFi on Solana — Yield-powered launchpad</h2>
            <p className="mt-3 text-slate-700">LiquidGen lets users lock LP positions (e.g. $LQ-$SOL, $SOL-USD) to earn yield. A configurable portion of that yield is used to buy back newly launching tokens (voted by the community) and burn $LQ — aligning incentives between LP providers, projects, and token holders.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-100 bg-gradient-to-b from-white to-sky-50">
                <h3 className="font-semibold">Why this attracts users</h3>
                <ul className="mt-2 text-slate-700 list-disc list-inside">
                  <li>Maximize returns from low-risk LP lockups</li>
                  <li>Participate in governance and vote which projects receive buybacks</li>
                  <li>$LQ deflation via burn mechanics tied to buybacks</li>
                  <li>Built-in swap aggregation, LP mining, and launchpad tools</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg border border-slate-100 bg-gradient-to-b from-white to-emerald-50">
                <h3 className="font-semibold">Token mechanics (high level)</h3>
                <p className="mt-2 text-slate-700">Protocol takes yield generated from locked LPs (example below) — after a small platform ops fee — most yield is used to buy SOL & USD into newly launched tokens. Simultaneously a share of LQ is burned and LPs receive their usual yield share.</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium">Example (live calculator)</h4>
              <p className="mt-1 text-sm text-slate-600">Adjust parameters to see how $10M at 20% APR behaves and how buybacks are scheduled.</p>
            </div>

            {/* Calculator controls */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-100 bg-white">
                <label className="block text-sm font-medium text-slate-700">Total locked (USD)</label>
                <input type="number" value={lockedValue} onChange={(e) => setLockedValue(Number(e.target.value))} className="mt-2 w-full rounded-md border p-2" />

                <label className="block text-sm font-medium text-slate-700 mt-3">Average APR (%)</label>
                <input type="number" value={apr} onChange={(e) => setApr(Number(e.target.value))} className="mt-2 w-full rounded-md border p-2" />

                <label className="block text-sm font-medium text-slate-700 mt-3">Buybacks / month</label>
                <input type="number" value={buybacksPerMonth} onChange={(e) => setBuybacksPerMonth(Number(e.target.value))} className="mt-2 w-full rounded-md border p-2" />

                <label className="block text-sm font-medium text-slate-700 mt-3">Buyback allocation of yield (%)</label>
                <input type="range" min={0} max={1} step={0.01} value={buybackAllocationPct} onChange={(e) => setBuybackAllocationPct(Number(e.target.value))} className="mt-2 w-full" />
                <div className="text-sm text-slate-600">{Math.round(buybackAllocationPct * 100)}%</div>

                <label className="block text-sm font-medium text-slate-700 mt-3">Platform fee (of yield) (%)</label>
                <input type="range" min={0} max={0.1} step={0.001} value={platformFeePct} onChange={(e) => setPlatformFeePct(Number(e.target.value))} className="mt-2 w-full" />
                <div className="text-sm text-slate-600">{(platformFeePct * 100).toFixed(2)}%</div>

                <label className="block text-sm font-medium text-slate-700 mt-3">LQ burn parameter (demo)</label>
                <input type="number" value={lqBurnRatePct} onChange={(e) => setLqBurnRatePct(Number(e.target.value))} className="mt-2 w-full rounded-md border p-2" />
                <div className="text-xs text-slate-500 mt-1">Units burned per $100k of buybacks (demo metric)</div>
              </div>

              <div className="p-4 rounded-lg border border-slate-100 bg-white">
                <h5 className="font-semibold">Vote allocation (A / B / C)</h5>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <input type="number" value={allocA} onChange={(e) => setAllocA(Number(e.target.value))} className="rounded-md border p-2" />
                  <input type="number" value={allocB} onChange={(e) => setAllocB(Number(e.target.value))} className="rounded-md border p-2" />
                  <input type="number" value={allocC} onChange={(e) => setAllocC(Number(e.target.value))} className="rounded-md border p-2" />
                </div>

                <div className="mt-4">
                  <h6 className="font-medium">Results</h6>
                  <div className="mt-2 text-sm text-slate-700">
                    <div>Annual yield: <strong>${fmt(results.annualYield)}</strong></div>
                    <div>Monthly yield: <strong>${fmt(results.monthlyYield)}</strong></div>
                    <div>Yield after platform fee: <strong>${fmt(results.yieldAfterPlatformFee)}</strong></div>
                    <div>Buyback pool / month: <strong>${fmt(results.buybackPool)}</strong></div>
                    <div>Average per buyback: <strong>${fmt(results.perBuyback)}</strong></div>
                    <div className="mt-2">Allocations — A: <strong>${fmt(results.alloc.A)}</strong>, B: <strong>${fmt(results.alloc.B)}</strong>, C: <strong>${fmt(results.alloc.C)}</strong></div>
                    <div className="mt-2">Simulated LQ burned (units): <strong>{fmt(results.burnedLqUnits)}</strong></div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button onClick={copySummary} className="px-4 py-2 bg-emerald-600 text-white rounded">Copy summary</button>
                    <button onClick={() => window.print()} className="px-4 py-2 border rounded">Print</button>
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-6">
              <h6 className="font-medium">Simulated buyback schedule (30 days)</h6>
              <div className="mt-3 h-56 bg-white/80 p-3 rounded border border-slate-100">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#3182CE" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </motion.div>
        </section>

        {/* Right column: quick stats & CTA */}
        <aside className="rounded-2xl p-6 bg-white/60 border border-slate-100 shadow">
          <div className="text-sm text-slate-600">Quick overview</div>
          <div className="mt-3 grid gap-3">
            <div className="p-3 bg-white rounded-lg border">
              <div className="text-xs text-slate-500">Locked value</div>
              <div className="text-xl font-semibold">${fmt(lockedValue)}</div>
            </div>

            <div className="p-3 bg-white rounded-lg border">
              <div className="text-xs text-slate-500">Avg APR</div>
              <div className="text-xl font-semibold">{fmt(apr)}%</div>
            </div>

            <div className="p-3 bg-white rounded-lg border">
              <div className="text-xs text-slate-500">Monthly buyback pool</div>
              <div className="text-xl font-semibold">${fmt(results.buybackPool)}</div>
            </div>

            <div className="p-3 bg-white rounded-lg border">
              <div className="text-xs text-slate-500">Est. LQ burned (demo)</div>
              <div className="text-xl font-semibold">{fmt(results.burnedLqUnits)}</div>
            </div>
          </div>

          <div className="mt-6">
            <h6 className="font-semibold">Next steps</h6>
            <ol className="mt-2 text-sm text-slate-700 list-decimal list-inside">
              <li>Wire up price oracles (Pyth / Switchboard) for SOL/USD and token prices.</li>
              <li>Implement on-chain mechanic: yield collector vault & automated swap-to-target-token executed by keeper bots or cron triggers.</li>
              <li>Design governance voting UI to choose launch projects and vote weight from locked LPs.</li>
              <li>Audit and simulate MEV/resilience for buyback execution — ensure execution slippage protection.</li>
            </ol>
          </div>

          <div className="mt-6 flex gap-2">
            <button className="flex-1 px-4 py-2 bg-sky-600 text-white rounded">Launch demo</button>
            <button className="px-4 py-2 border rounded">Get whitepaper</button>
          </div>
        </aside>

      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-sm text-slate-500">© LiquidGen — Demo landing page</footer>
    </div>
  );
}
