"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * TokenFlow — WebGL hero. Glowing tokens stream from user nodes on the left,
 * through the ProtAI core, out to provider nodes on the right. Mouse parallax.
 */
export function TokenFlow({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.055);
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 1.6, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    mount.appendChild(renderer.domElement);

    // soft round sprite for glow points
    function glowTexture(): THREE.Texture {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const sprite = glowTexture();

    const group = new THREE.Group();
    scene.add(group);

    // --- nodes ---
    const nodeGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 1);

    const userNodes: THREE.Vector3[] = [];
    const providerNodes: THREE.Vector3[] = [];
    const userMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const providerMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa });

    const userY = [-2.2, -0.7, 0.8, 2.3];
    userY.forEach((y) => {
      const m = new THREE.Mesh(nodeGeo, userMat);
      m.position.set(-5.2, y, 0);
      group.add(m);
      userNodes.push(m.position.clone());
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0x38bdf8, transparent: true, opacity: 0.5 }));
      halo.scale.setScalar(1.6);
      halo.position.copy(m.position);
      group.add(halo);
    });

    const providerY = [-1.8, 0, 1.8];
    providerY.forEach((y) => {
      const m = new THREE.Mesh(nodeGeo, providerMat);
      m.position.set(5.2, y, 0);
      group.add(m);
      providerNodes.push(m.position.clone());
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0xa78bfa, transparent: true, opacity: 0.5 }));
      halo.scale.setScalar(1.6);
      halo.position.copy(m.position);
      group.add(halo);
    });

    // ProtAI core
    const core = new THREE.Mesh(
      coreGeo,
      new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.9 })
    );
    group.add(core);
    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0x34d399, transparent: true, opacity: 0.65 }));
    coreGlow.scale.setScalar(4.2);
    group.add(coreGlow);
    const corePos = new THREE.Vector3(0, 0.1, 0);

    // --- token particles along curved paths ---
    const PATHS: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3 }[] = [];
    userNodes.forEach((u) => {
      PATHS.push({ a: u, b: new THREE.Vector3(-2.4, (u.y + corePos.y) / 2, 0.6), c: corePos });
    });
    providerNodes.forEach((p) => {
      PATHS.push({ a: corePos, b: new THREE.Vector3(2.4, (p.y + corePos.y) / 2, -0.6), c: p });
    });

    const COUNT = 420;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const meta: { path: number; t: number; speed: number; size: number }[] = [];

    const cEmerald = new THREE.Color(0x34d399);
    const cSky = new THREE.Color(0x38bdf8);
    const cViolet = new THREE.Color(0xa78bfa);

    for (let i = 0; i < COUNT; i++) {
      const path = Math.floor(Math.random() * PATHS.length);
      meta.push({ path, t: Math.random(), speed: 0.0016 + Math.random() * 0.0032, size: 0.5 + Math.random() });
      const col = path < userNodes.length ? cSky.clone().lerp(cEmerald, 0.4) : cEmerald.clone().lerp(cViolet, 0.35);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    group.add(points);

    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
    const tmp = new THREE.Vector3();

    // mouse parallax
    let mx = 0, my = 0, tx = 0, ty = 0;
    function onMouse(e: MouseEvent) {
      const r = mount!.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    window.addEventListener("mousemove", onMouse);

    let raf = 0;
    const clock = new THREE.Clock();
    function tick() {
      const t = clock.getElapsedTime();

      // advance tokens
      for (let i = 0; i < COUNT; i++) {
        const m = meta[i];
        m.t += m.speed;
        if (m.t > 1) { m.t = 0; m.path = Math.floor(Math.random() * PATHS.length); }
        const P = PATHS[m.path];
        curve.v0.copy(P.a); curve.v1.copy(P.b); curve.v2.copy(P.c);
        curve.getPoint(m.t, tmp);
        // shimmer
        tmp.y += Math.sin(t * 3 + i) * 0.03;
        positions[i * 3] = tmp.x;
        positions[i * 3 + 1] = tmp.y;
        positions[i * 3 + 2] = tmp.z;
      }
      pGeo.attributes.position.needsUpdate = true;

      // core motion
      core.rotation.y = t * 0.35;
      core.rotation.x = t * 0.12;
      const pulse = 1 + Math.sin(t * 2.2) * 0.06;
      core.scale.setScalar(pulse);
      coreGlow.scale.setScalar(4.2 * pulse);

      // parallax
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      camera.position.x = mx * 1.4;
      camera.position.y = 1.6 - my * 0.9;
      camera.lookAt(0, 0.1, 0);
      group.rotation.y = mx * 0.08;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    function onResize() {
      const w = mount!.clientWidth, h = mount!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      sprite.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden />;
}
