"use client";

/* eslint-disable react/no-unknown-property */
import * as THREE from 'three';
import { useRef, useState, useEffect, memo, ReactNode } from 'react';
import { Canvas, createPortal, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import {
    useFBO,
    useGLTF,
    useScroll,
    Image,
    Scroll,
    Preload,
    ScrollControls,
    MeshTransmissionMaterial,
    Text
} from '@react-three/drei';
import { easing } from 'maath';

type Mode = 'lens' | 'bar' | 'cube';

interface NavItem {
    label: string;
    link: string;
}

type ModeProps = Record<string, unknown>;

interface FluidGlassProps {
    mode?: Mode;
    lensProps?: ModeProps;
    barProps?: ModeProps;
    cubeProps?: ModeProps;
}

export default function FluidGlass({ mode = 'lens', lensProps = {}, barProps = {}, cubeProps = {} }: FluidGlassProps) {
    // If we're on mobile, we might want to disable this for performance
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    if (isMobile) return null;

    const Wrapper = mode === 'bar' ? Bar : mode === 'cube' ? Cube : Lens;
    const rawOverrides = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;

    const {
        navItems = [],
        ...modeProps
    } = rawOverrides;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <Canvas camera={{ position: [0, 0, 20], fov: 15 }} gl={{ alpha: true }}>
                <ScrollControls damping={0.2} pages={1} distance={0}>
                    <Wrapper modeProps={modeProps}>
                        <Preload />
                    </Wrapper>
                </ScrollControls>
            </Canvas>
        </div>
    );
}

type MeshProps = ThreeElements['mesh'];

interface ModeWrapperProps extends MeshProps {
    children?: ReactNode;
    glb?: string;
    geometryKey?: string;
    lockToBottom?: boolean;
    followPointer?: boolean;
    modeProps?: ModeProps;
    fallbackType?: 'sphere' | 'box';
}

const ModeWrapper = memo(function ModeWrapper({
    children,
    glb,
    geometryKey,
    lockToBottom = false,
    followPointer = true,
    modeProps = {},
    fallbackType = 'sphere',
    ...props
}: ModeWrapperProps) {
    const ref = useRef<THREE.Mesh>(null!);
    const buffer = useFBO();
    const { viewport: vp } = useThree();
    const [scene] = useState<THREE.Scene>(() => new THREE.Scene());

    // Try to load GLTF, but have a fallback
    let nodes: any = {};
    try {
        if (glb) {
            const gltf = useGLTF(glb);
            nodes = gltf.nodes;
        }
    } catch (e) {
        // console.log("GLTF load failed, using fallback");
    }

    useFrame((state, delta) => {
        const { gl, viewport, pointer, camera } = state;
        const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

        const destX = followPointer ? (pointer.x * v.width) / 2 : 0;
        const destY = lockToBottom ? -v.height / 2 + 0.2 : followPointer ? (pointer.y * v.height) / 2 : 0;
        easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);

        gl.setRenderTarget(buffer);
        gl.render(scene, camera);
        gl.setRenderTarget(null);
    });

    const { scale, ior, thickness, anisotropy, chromaticAberration, ...extraMat } = modeProps as any;

    return (
        <>
            {createPortal(children, scene)}
            <mesh
                ref={ref}
                scale={scale ?? 0.15}
                {...props}
            >
                {glb && geometryKey && nodes[geometryKey] ? (
                    <primitive object={nodes[geometryKey].geometry} attach="geometry" />
                ) : fallbackType === 'sphere' ? (
                    <sphereGeometry args={[1, 32, 32]} />
                ) : (
                    <boxGeometry args={[1, 1, 1]} />
                )}
                <MeshTransmissionMaterial
                    buffer={buffer.texture}
                    ior={ior ?? 1.15}
                    thickness={thickness ?? 2}
                    anisotropy={anisotropy ?? 0.01}
                    chromaticAberration={chromaticAberration ?? 0.05}
                    transmission={1}
                    roughness={0}
                    {...extraMat}
                />
            </mesh>
        </>
    );
});

function Lens({ modeProps, ...p }: { modeProps?: ModeProps } & MeshProps) {
    return <ModeWrapper fallbackType="sphere" followPointer modeProps={modeProps} {...p} />;
}

function Cube({ modeProps, ...p }: { modeProps?: ModeProps } & MeshProps) {
    return <ModeWrapper fallbackType="box" followPointer modeProps={modeProps} {...p} />;
}

function Bar({ modeProps = {}, ...p }: { modeProps?: ModeProps } & MeshProps) {
    const defaultMat = {
        transmission: 1,
        roughness: 0,
        thickness: 10,
        ior: 1.15,
        color: '#ffffff',
        attenuationColor: '#ffffff',
        attenuationDistance: 0.25
    };

    return (
        <ModeWrapper
            fallbackType="box"
            lockToBottom
            followPointer={false}
            modeProps={{ ...defaultMat, ...modeProps }}
            {...p}
        />
    );
}
