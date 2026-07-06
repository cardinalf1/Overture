import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 border border-red-900/50 rounded-lg p-6 text-center">
          <div className="text-red-500 mb-2">⚠️ Failed to load 3D model</div>
          <div className="text-xs font-mono text-zinc-500">The STL file might be corrupted or in an unsupported format.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

function STLModel({ url }: { url: string }) {
  const geom = useLoader(STLLoader, url);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#71717a" roughness={0.5} metalness={0.8} />
    </mesh>
  );
}

export function ModelViewer({ url }: { url: string }) {
  return (
    <ErrorBoundary>
      <div className="w-full h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900 relative">
        <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5}>
              <STLModel url={url} />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
        </Canvas>
        <div className="absolute bottom-4 right-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest pointer-events-none">
          LBM / Virtual Wind Tunnel Active
        </div>
      </div>
    </ErrorBoundary>
  );
}
