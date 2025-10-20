/*
  LiquidGenLanding.tsx
  Converted from LiquidGenLanding.jsx to TypeScript
*/
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

// SOLANA WALLET ADAPTER imports
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

// Wallet adapter UI styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Replace with your deployed devnet LQ mint address
const LQ_MINT_ADDRESS = "Replace_With_Your_LQ_MINT_ON_DEVNET";
const FAUCET_ENDPOINT = "/api/faucet"; // dev stub will run on localhost:4000 via proxy

function useLQBalance(connection: Connection | null, walletPublicKey: PublicKey | null): number | null {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!connection || !walletPublicKey) return;
    let mounted = true;
    (async () => {
      try {
        const mint = new PublicKey(LQ_MINT_ADDRESS);
        const ata = await getAssociatedTokenAddress(mint, walletPublicKey);
        const acc = await connection.getAccountInfo(ata as any);
        if (!acc) {
          if (mounted) setBalance(0);
          return;
        }
        const resp: any = await connection.getTokenAccountsByOwner(walletPublicKey, { mint });
        if (resp.value.length === 0) {
          if (mounted) setBalance(0);
          return;
        }
        const accPub = resp.value[0].pubkey;
        const balResp: any = await connection.getTokenAccountBalance(accPub);
        if (mounted) setBalance(Number(balResp.value.uiAmount || 0));
      } catch (e) {
        console.error("balance error", e);
        if (mounted) setBalance(null);
      }
    })();
    return () => { mounted = false; };
  }, [connection, walletPublicKey]);
  return balance;
}

interface FaucetButtonProps {
  connection: Connection | null;
  publicKey: PublicKey | null;
}

function FaucetButton({ connection, publicKey }: FaucetButtonProps) {
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const balance = useLQBalance(connection, publicKey);

  const requestFaucet = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const res = await fetch(FAUCET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58(), amount: 1000 }),
      });
      const j = await res.json();
      if (res.ok) {
        setTxSig(j.tx || j.signature || null);
        console.log("Faucet minted, tx:", j.tx || j.signature);
      } else {
        alert("Faucet error: " + (j.error || res.statusText));
      }
    } catch (e) {
      console.error(e);
      alert("Faucet request failed");
    }
    setLoading(false);
  }, [publicKey]);

  return (
    <div className="mt-4">
      <div className="text-sm text-slate-600">Devnet faucet (auto LQ on connect)</div>
      <div className="mt-2 flex gap-2">
        <button onClick={requestFaucet} disabled={!publicKey || loading} className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">
          {loading ? 'Requesting...' : 'Request Devnet $LQ'}
        </button>
        {txSig && (
          <a className="px-3 py-2 border rounded" target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}>View tx</a>
        )}
      </div>
      <div className="mt-2 text-sm text-slate-700">Balance: {balance === null ? 'loading...' : balance}</div>
    </div>
  );
}

export default function LiquidGenLandingWithWallet(): JSX.Element {
  const network = "devnet";
  const endpoint = clusterApiUrl(network);
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <LandingInner connectionEndpoint={endpoint} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function LandingInner({ connectionEndpoint }: { connectionEndpoint: string }) {
  const { publicKey, connected } = useWallet();
  const connection = new Connection(connectionEndpoint, "confirmed");

  const [lockedValue, setLockedValue] = useState<number>(10000000);
  const [apr, setApr] = useState<number>(20);
  const [buybacksPerMonth, setBuybacksPerMonth] = useState<number>(15);
  const [buybackAllocationPct, setBuybackAllocationPct] = useState<number>(0.9);
  const [platformFeePct, setPlatformFeePct] = useState<number>(0.02);
  const [lqBurnRatePct, setLqBurnRatePct] = useState<number>(1);
  const [allocA, setAllocA] = useState<number>(60);
  const [allocB, setAllocB] = useState<number>(30);
  const [allocC, setAllocC] = useState<number>(10);

  const fmt = (v: number) => (v >= 1 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toFixed(6));

  const results = useMemo(() => {
    const annualYield = lockedValue * (apr / 100);
    const monthlyYield = annualYield / 12;
    const yieldAfterPlatformFee = monthlyYield * (1 - platformFeePct);
    const buybackPool = yieldAfterPlatformFee * buybackAllocationPct;
    const perBuyback = buybackPool / Math.max(1, buybacksPerMonth);
    const allocSum = Math.max(1, allocA + allocB + allocC);
    const alloc = {
      A: (allocA / allocSum) * buybackPool,
      B: (allocB / allocSum) * buybackPool,
      C: (allocC / allocSum) * buybackPool,
    };
    const burnedLqUnits = (buybackPool / 100000) * (lqBurnRatePct);
    return { annualYield, monthlyYield, yieldAfterPlatformFee, buybackPool, perBuyback, alloc, burnedLqUnits };
  }, [lockedValue, apr, buybacksPerMonth, buybackAllocationPct, platformFeePct, allocA, allocB, allocC, lqBurnRatePct]);

  const buybackSchedule = useMemo(() => {
    const days = 30;
    const arr: Array<{ day: number; amount: number }> = [];
    let remaining = results.buybackPool;
    for (let i = 0; i < days; i++) {
      const prob = buybacksPerMonth / 30;
      const happens = Math.random() < prob;
      let amt = 0;
      if (happens) {
        const jitter = 1 + (Math.random() - 0.5) * 0.6;
        amt = Math.max(0, Math.min(remaining, results.perBuyback * jitter));
        remaining -= amt;
      }
      arr.push({ day: i + 1, amount: Math.round(amt) });
    }
    if (remaining > 0) arr[arr.length - 1].amount += Math.round(remaining);
    return arr;
  }, [results, buybacksPerMonth]);

  const chartData = buybackSchedule.map((d) => ({ name: `D${d.day}`, amount: d.amount }));

  const copySummary = async () => {
    const text = `LiquidGen summary:\nLocked: $${fmt(lockedValue)}\nAPR: ${fmt(apr)}%\nMonthly yield: $${fmt(results.monthlyYield)}\nBuyback pool/month: $${fmt(results.buybackPool)}`;
    await navigator.clipboard.writeText(text);
    alert("Summary copied to clipboard");
  };

  useEffect(() => {
    if (!publicKey) return;
    (async () => {
      try {
        await fetch(FAUCET_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: publicKey.toBase58(), amount: 100 }),
        });
      } catch (e) {
        console.warn("auto faucet failed", e);
      }
    })();
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-emerald-50 to-white p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between py-8">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900">LiquidGen</h1>
          <p className="mt-1 text-slate-600">Turn LP yield into buybacks for new launches — $LQ + $SOL on Solana (devnet)</p>
        </div>
        <div className="flex gap-3 items-center">
          <WalletMultiButton />
          {connected && publicKey && (
            <div className="text-sm text-slate-600">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-6)}</div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <h6 className="font-semibold">Devnet faucet</h6>
            {publicKey ? (
              <FaucetButton connection={connection} publicKey={publicKey} />
            ) : (
              <div className="text-sm text-slate-600">Connect your wallet to receive devnet $LQ automatically.</div>
            )}

            <div className="mt-6">
              <h6 className="font-semibold">Next steps</h6>
              <ol className="mt-2 text-sm text-slate-700 list-decimal list-inside">
                <li>Deploy LQ SPL token on devnet and set up a faucet service that mints tokens to requesters.</li>
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
          </div>
        </aside>

      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-sm text-slate-500">© LiquidGen — Devnet prototype</footer>
    </div>
  );
}
