"use client";

import { useRef, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Float, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

interface PayoffSurfaceProps {
  spot: number;
  strike: number;
  isPut: boolean;
  premium?: number;
  vol?: number;        // annualized (e.g. 0.43)
  rate?: number;       // annualized
  expiryYears?: number;
}

// ─── Black-Scholes math (call and put) ───────────────────────────────────────
const SQRT_2_PI = Math.sqrt(2 * Math.PI);

function pdfNorm(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2_PI;
}

function cdfNorm(x: number): number {
  // Abramowitz & Stegun approximation
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}

interface BSResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;     // per year
  vega: number;      // per 100% vol change
}

function blackScholes(S: number, K: number, T: number, r: number, sigma: number, isPut: boolean): BSResult {
  // Edge case: at expiry
  if (T <= 0 || sigma <= 0 || S <= 0) {
    const intrinsic = isPut ? Math.max(0, K - S) : Math.max(0, S - K);
    return {
      price: intrinsic,
      delta: isPut ? (S < K ? -1 : 0) : (S > K ? 1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
    };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const Nd1 = cdfNorm(d1);
  const Nd2 = cdfNorm(d2);
  const nd1 = pdfNorm(d1);

  let price: number;
  let delta: number;
  let theta: number;

  if (isPut) {
    price = K * Math.exp(-r * T) * cdfNorm(-d2) - S * cdfNorm(-d1);
    delta = Nd1 - 1;
    theta =
      -(S * nd1 * sigma) / (2 * sqrtT) +
      r * K * Math.exp(-r * T) * cdfNorm(-d2);
  } else {
    price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    theta =
      -(S * nd1 * sigma) / (2 * sqrtT) -
      r * K * Math.exp(-r * T) * Nd2;
  }

  const gamma = nd1 / (S * sigma * sqrtT);
  const vega = S * nd1 * sqrtT; // per 1.0 vol change → divide by 100 for 1% vol

  return { price, delta, gamma, theta, vega };
}

function bsPriceOnly(S: number, K: number, T: number, r: number, sigma: number, isPut: boolean): number {
  return blackScholes(S, K, T, r, sigma, isPut).price;
}

/**
 * Probability that the option finishes profitable at expiry (P&L > 0).
 * For long call: P(S_T > breakeven), for long put: P(S_T < breakeven).
 * Uses lognormal distribution with mu = (r - sigma²/2)*T.
 */
function probabilityOfProfit(S: number, K: number, T: number, r: number, sigma: number, isPut: boolean, premium: number): number {
  if (T <= 0 || sigma <= 0 || S <= 0) {
    const intrinsicNow = isPut ? Math.max(0, K - S) : Math.max(0, S - K);
    return intrinsicNow > premium ? 1 : 0;
  }
  const breakeven = isPut ? K - premium : K + premium;
  if (breakeven <= 0) return 1;
  const sqrtT = Math.sqrt(T);
  const d = (Math.log(breakeven / S) - (r - 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  // For a long call we need S_T > breakeven → 1 - N(d)
  // For a long put we need S_T < breakeven → N(d)
  return isPut ? cdfNorm(d) : 1 - cdfNorm(d);
}

interface HoverInfo {
  spotAtPoint: number;
  daysToExpiry: number;
  pnl: number;
  delta: number;
  gamma: number;
  theta: number;     // per day
  vega: number;      // per 1% vol change
  screenX: number;
  screenY: number;
}

interface SurfaceProps extends Required<Omit<PayoffSurfaceProps, never>> {
  timeSliceFrac: number;
  onHover: (info: HoverInfo | null) => void;
}

function PayoffMesh({ spot, strike, isPut, premium, vol, rate, expiryYears, timeSliceFrac, onHover }: SurfaceProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { geometry, currentX, currentY, currentZ, breakeven, sliceMeta, scale } = useMemo(() => {
    const spotSamples = 32;
    const timeSamples = 16;

    const spotMin = strike * 0.5;
    const spotMax = strike * 1.5;
    const spotStep = (spotMax - spotMin) / spotSamples;
    const timeStep = expiryYears / timeSamples;

    const scaleX = 4 / strike;
    const scaleY = 4 / strike;
    const scaleZ = 4 / Math.max(0.001, expiryYears);

    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let zi = 0; zi <= timeSamples; zi++) {
      const tRemaining = zi * timeStep;
      const zPos = (zi - timeSamples / 2) * timeStep * scaleZ * 0.5;

      for (let xi = 0; xi <= spotSamples; xi++) {
        const s = spotMin + xi * spotStep;
        const value = bsPriceOnly(s, strike, tRemaining, rate, vol, isPut) - premium;

        const x = (s - strike) * scaleX;
        const y = value * scaleY;

        positions.push(x, y, zPos);

        const c = new THREE.Color();
        if (value > 0.001) {
          const intensity = Math.min(1, 0.4 + value * 0.5);
          c.setHSL(0.5, 0.85, intensity * 0.55);
        } else if (value < -0.001) {
          c.setHSL(0.78, 0.7, 0.55);
        } else {
          c.setHSL(0.62, 0.7, 0.5);
        }
        const depthFade = 0.5 + (zi / timeSamples) * 0.5;
        colors.push(c.r * depthFade, c.g * depthFade, c.b * depthFade);

        if (zi > 0 && xi > 0) {
          const cols = spotSamples + 1;
          const a = (zi - 1) * cols + (xi - 1);
          const b = (zi - 1) * cols + xi;
          const c2 = zi * cols + (xi - 1);
          const d = zi * cols + xi;
          indices.push(a, c2, b);
          indices.push(b, c2, d);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const valueNow = bsPriceOnly(spot, strike, expiryYears, rate, vol, isPut) - premium;
    const cx = (spot - strike) * scaleX;
    const cy = valueNow * scaleY;
    const cz = (timeSamples - timeSamples / 2) * timeStep * scaleZ * 0.5;

    const beSpot = isPut ? strike - premium : strike + premium;
    const beX = (beSpot - strike) * scaleX;

    return {
      geometry: geo,
      currentX: cx,
      currentY: cy,
      currentZ: cz,
      breakeven: beX,
      sliceMeta: { spotMin, spotStep, spotSamples, timeStep, timeSamples, scaleZ },
      scale: { scaleX, scaleY, scaleZ },
    };
  }, [spot, strike, isPut, premium, vol, rate, expiryYears]);

  const sliceZ = useMemo(() => {
    const { timeSamples, timeStep, scaleZ } = sliceMeta;
    const zi = timeSliceFrac * timeSamples;
    return (zi - timeSamples / 2) * timeStep * scaleZ * 0.5;
  }, [timeSliceFrac, sliceMeta]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.06;
    }
  });

  // ─── Hover handler — convert world coords to spot/time + compute greeks ──
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = event.point.clone();
    if (groupRef.current) {
      groupRef.current.worldToLocal(point);
    }

    const spotAtPoint = point.x / scale.scaleX + strike;
    const zi = point.z / (sliceMeta.timeStep * sliceMeta.scaleZ * 0.5) + sliceMeta.timeSamples / 2;
    const tRemaining = Math.max(0.0001, Math.min(expiryYears, zi * sliceMeta.timeStep));
    const daysToExpiry = tRemaining * 365;

    const result = blackScholes(spotAtPoint, strike, tRemaining, rate, vol, isPut);
    const pnl = result.price - premium;

    onHover({
      spotAtPoint,
      daysToExpiry,
      pnl,
      delta: result.delta,
      gamma: result.gamma,
      theta: result.theta / 365,    // per day
      vega: result.vega / 100,       // per 1% vol change
      screenX: event.nativeEvent.offsetX,
      screenY: event.nativeEvent.offsetY,
    });
  }, [strike, isPut, premium, vol, rate, expiryYears, scale, sliceMeta, onHover]);

  const handlePointerOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
          emissive="#0a0d14"
          emissiveIntensity={0.2}
          metalness={0.15}
          roughness={0.5}
        />
      </mesh>

      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#00e5ff"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Time slice plane */}
      <mesh position={[0, 0, sliceZ]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Strike marker */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 5, 0.04]} />
        <meshStandardMaterial color="#9b6bff" emissive="#9b6bff" emissiveIntensity={1.5} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
        <mesh position={[0, 2.6, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#9b6bff" emissive="#9b6bff" emissiveIntensity={1.2} />
        </mesh>
      </Float>
      <Billboard position={[0, 3.0, 0]}>
        <Text fontSize={0.22} color="#9b6bff" anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000000">
          STRIKE ${strike.toFixed(2)}
        </Text>
      </Billboard>

      {/* Breakeven */}
      <mesh position={[breakeven, 0, 0]}>
        <boxGeometry args={[0.025, 4, 0.025]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.5} />
      </mesh>
      <Billboard position={[breakeven, 2.4, 0]}>
        <Text fontSize={0.16} color="#00e5ff" anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#000000">
          BREAKEVEN
        </Text>
      </Billboard>

      {/* Current spot marker */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <mesh position={[currentX, currentY + 0.25, currentZ]}>
          <sphereGeometry args={[0.16, 32, 32]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2} />
        </mesh>
      </Float>
      <mesh position={[currentX, currentY + 0.25, currentZ]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.32, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Billboard position={[currentX, currentY + 0.85, currentZ]}>
        <Text fontSize={0.18} color="#00e5ff" anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000000">
          SPOT ${spot.toFixed(2)} · TODAY
        </Text>
      </Billboard>

      <Billboard position={[3.5, 0.4, currentZ]}>
        <Text fontSize={0.14} color="#6b8fff" anchorX="left" anchorY="middle" outlineWidth={0.005} outlineColor="#000000" fillOpacity={0.7}>
          TODAY
        </Text>
      </Billboard>
      <Billboard position={[3.5, 0.4, -currentZ]}>
        <Text fontSize={0.14} color="#00e5ff" anchorX="left" anchorY="middle" outlineWidth={0.005} outlineColor="#000000" fillOpacity={0.7}>
          EXPIRY
        </Text>
      </Billboard>

      <Billboard position={[-5.5, 2.2, 0]}>
        <Text fontSize={0.18} color="#00e5ff" anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#000000">
          PROFIT
        </Text>
      </Billboard>
      <Billboard position={[-5.5, -1.6, 0]}>
        <Text fontSize={0.18} color="#9b6bff" anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#000000">
          LOSS
        </Text>
      </Billboard>
      <Billboard position={[0, -2.2, 0]}>
        <Text fontSize={0.16} color="#f0f4ff" anchorX="center" anchorY="middle" fillOpacity={0.5} outlineWidth={0.006} outlineColor="#000000">
          XRP / USD →
        </Text>
      </Billboard>
    </group>
  );
}

export default function PayoffSurface3D(props: PayoffSurfaceProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [timeSlice, setTimeSlice] = useState(1);
  const [quantity, setQuantity] = useState(1);

  const expiryYears = props.expiryYears ?? 0.0822;
  const vol = props.vol ?? 0.43;
  const rate = props.rate ?? 0;
  const premium = props.premium ?? 0;

  const sliceDays = (timeSlice * expiryYears * 365).toFixed(0);

  const { atTheMoneyValue, breakevenSpot, pop, maxLoss, maxProfit } = useMemo(() => {
    const T = timeSlice * expiryYears;
    const atmValue = bsPriceOnly(props.strike, props.strike, T, rate, vol, props.isPut) - premium;
    const beSpot = props.isPut ? props.strike - premium : props.strike + premium;
    const probability = probabilityOfProfit(props.spot, props.strike, expiryYears, rate, vol, props.isPut, premium);
    // Max loss for a long option = premium paid (per contract)
    const maxLossPerContract = premium;
    // Max profit: unbounded for call, capped at strike-premium for put
    const maxProfitPerContract = props.isPut ? props.strike - premium : Infinity;
    return {
      atTheMoneyValue: atmValue,
      breakevenSpot: beSpot,
      pop: probability,
      maxLoss: maxLossPerContract,
      maxProfit: maxProfitPerContract,
    };
  }, [timeSlice, props.strike, props.isPut, props.spot, vol, rate, premium, expiryYears]);

  const totalRisk = maxLoss * quantity;
  const totalMaxProfit = isFinite(maxProfit) ? maxProfit * quantity : Infinity;
  const hoverPnLTotal = hover ? hover.pnl * quantity : 0;

  const popColor = pop >= 0.6 ? "#00e5ff" : pop >= 0.4 ? "#6b8fff" : "#9b6bff";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0d14] to-[#0d1325] border border-white/[0.06]">
      {/* 3D canvas */}
      <div className="relative h-[320px]">
        <Canvas
          camera={{ position: [4, 3, 7], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 8, 10]} intensity={1.4} color="#6b8fff" />
            <pointLight position={[-5, -3, -10]} intensity={0.8} color="#9b6bff" />
            <pointLight position={[0, 5, 5]} intensity={0.6} color="#00e5ff" />
            <directionalLight position={[3, 5, 2]} intensity={0.5} />

            <PayoffMesh
              spot={props.spot}
              strike={props.strike}
              isPut={props.isPut}
              premium={premium}
              vol={vol}
              rate={rate}
              expiryYears={expiryYears}
              timeSliceFrac={timeSlice}
              onHover={setHover}
            />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.2}
              autoRotate={!hover}
              autoRotateSpeed={0.3}
            />
          </Suspense>
        </Canvas>

        {/* Hover tooltip with greeks */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 bg-[#0a0d14]/95 border border-brand-cyan/40 rounded-lg px-3 py-2.5 backdrop-blur-sm shadow-[0_0_20px_rgba(0,229,255,0.2)] font-mono text-xs"
            style={{
              left: hover.screenX + 14,
              top: hover.screenY + 14,
              minWidth: 200,
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <div className="col-span-2 flex items-center justify-between mb-1 pb-1 border-b border-white/10">
                <span className="text-brand-text/40 uppercase text-[9px] tracking-wider">Spot · T-minus</span>
                <span className="text-brand-cyan">${hover.spotAtPoint.toFixed(3)} · {hover.daysToExpiry.toFixed(1)}d</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-brand-text/40 text-[9px] uppercase tracking-wider">P&amp;L</span>
                <span
                  className="font-bold"
                  style={{ color: hover.pnl > 0 ? "#00e5ff" : hover.pnl < 0 ? "#9b6bff" : "#6b8fff" }}
                >
                  {hover.pnl >= 0 ? "+" : ""}${hover.pnl.toFixed(4)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-brand-text/40 text-[9px] uppercase tracking-wider">Total</span>
                <span
                  className="font-bold"
                  style={{ color: hoverPnLTotal > 0 ? "#00e5ff" : hoverPnLTotal < 0 ? "#9b6bff" : "#6b8fff" }}
                >
                  {hoverPnLTotal >= 0 ? "+" : ""}${hoverPnLTotal.toFixed(2)}
                </span>
              </div>

              <div className="col-span-2 mt-1 pt-1 border-t border-white/10 grid grid-cols-2 gap-x-3 gap-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-brand-text/40 text-[9px] uppercase tracking-wider">Δ</span>
                  <span className="text-brand-text/80">{hover.delta.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-brand-text/40 text-[9px] uppercase tracking-wider">Γ</span>
                  <span className="text-brand-text/80">{hover.gamma.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-brand-text/40 text-[9px] uppercase tracking-wider">Θ /day</span>
                  <span className="text-brand-text/80">{hover.theta.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-brand-text/40 text-[9px] uppercase tracking-wider">V /1%</span>
                  <span className="text-brand-text/80">{hover.vega.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend overlay (top-left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-cyan" />
            <span className="text-brand-text/50">Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-purple" />
            <span className="text-brand-text/50">Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-blue" />
            <span className="text-brand-text/50">Strike</span>
          </div>
        </div>

        {/* POP badge top-right */}
        <div className="absolute top-3 right-3 bg-[#0a0d14]/90 border border-white/[0.08] rounded-lg px-3 py-2 backdrop-blur-sm">
          <p className="text-[9px] uppercase tracking-wider text-brand-text/40 mb-0.5">Prob. Profit</p>
          <p
            className="text-xl font-bold font-mono leading-none"
            style={{ color: popColor, textShadow: `0 0 12px ${popColor}80` }}
          >
            {(pop * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Time scrubber + Quantity controls */}
      <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.02] flex flex-col gap-4">
        {/* Time slice scrubber */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-brand-text/40 uppercase tracking-widest font-semibold">
              Time slice
            </span>
            <span className="text-xs font-mono text-brand-cyan">
              T-minus {sliceDays}d
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={timeSlice}
            onChange={(e) => setTimeSlice(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer slider-glow"
          />
          <div className="flex items-center justify-between mt-1.5 text-[9px] font-mono uppercase tracking-wider">
            <span className="text-brand-cyan">expiry</span>
            <span className="text-brand-text/30">
              ATM ${atTheMoneyValue.toFixed(4)} · BE ${breakevenSpot.toFixed(2)}
            </span>
            <span className="text-brand-blue">today</span>
          </div>
        </div>

        {/* Position sizing & risk */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-text/40 uppercase tracking-widest font-semibold">
              Position
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-brand-text font-mono text-xs focus:outline-none focus:border-brand-cyan/50 transition-colors"
            />
            <span className="text-[10px] text-brand-text/30 font-mono">contracts</span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-[10px] font-mono">
            <div className="flex flex-col items-end">
              <span className="text-brand-text/40 uppercase tracking-wider text-[9px]">Max Loss</span>
              <span className="text-brand-purple font-bold">-${totalRisk.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-brand-text/40 uppercase tracking-wider text-[9px]">Max Profit</span>
              <span className="text-brand-cyan font-bold">
                {isFinite(totalMaxProfit) ? `+$${totalMaxProfit.toFixed(2)}` : "∞"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-glow::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.7);
          cursor: pointer;
        }
        .slider-glow::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.7);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
