"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import type * as THREE from "three"
import { Vector2, type ShaderMaterial } from "three"
import { useWindowSize } from "@/lib/use-window-size"

const FluidShader = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport, gl } = useThree()
  const size = useWindowSize()

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new Vector2(size.width || 1, size.height || 1) },
      u_mouse: { value: new Vector2(0.5, 0.5) },
    }),
    [size],
  )

  useEffect(() => {
    if (size.width && size.height) {
      uniforms.u_resolution.value.set(size.width, size.height)
    }
  }, [size, uniforms.u_resolution.value])

  useEffect(() => {
    const canvas = gl.domElement
    const canvasRect = canvas.getBoundingClientRect()

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY

      const relativeX = (x - canvasRect.left) / canvasRect.width
      const relativeY = 1 - (y - canvasRect.top) / canvasRect.height
      
      uniforms.u_mouse.value.x = Math.max(0, Math.min(1, relativeX))
      uniforms.u_mouse.value.y = Math.max(0, Math.min(1, relativeY))
    }

    const updateCanvasRect = () => {
      Object.assign(canvasRect, canvas.getBoundingClientRect())
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", updateCanvasRect)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", updateCanvasRect)
    }
  }, [gl, uniforms.u_mouse.value])

  useFrame((state) => {
    if (!meshRef.current) return
    const material = meshRef.current.material as ShaderMaterial
    material.uniforms.u_time.value = state.clock.getElapsedTime()
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec2 v_uv;
          
          void main() {
            v_uv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          precision mediump float;
          #define GLSLIFY 1

          uniform float u_time;
          uniform vec2 u_mouse;
          uniform vec2 u_resolution;
          varying vec2 v_uv;

          float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = sin(i.x + i.y * 31.23 + u_time);
              float b = sin(i.x + 1.0 + i.y * 31.23 + u_time);
              float c = sin(i.x + (i.y + 1.0) * 31.23 + u_time);
              float d = sin(i.x + 1.0 + (i.y + 1.0) * 31.23 + u_time);
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          float fbm(vec2 p) {
              float sum = 0.0;
              float amp = 1.0;
              float freq = 1.0;
              for(int i = 0; i < 6; i++) {
                  sum += noise(p * freq) * amp;
                  amp *= 0.5;
                  freq *= 2.0;
                  p += vec2(3.123, 1.732);
              }
              return sum;
          }

          void main() {
              vec2 uv = v_uv;
              vec2 aspect = vec2(u_resolution.x/u_resolution.y, 1.0);
              uv = uv * 2.0 - 1.0;
              uv *= aspect;
              
              vec2 mouseInfluence = (u_mouse * 2.0 - 1.0) * aspect;
              float mouseDist = length(uv - mouseInfluence);
              float mouseEffect = smoothstep(0.5, 0.0, mouseDist);
              
              float t = u_time * 0.2;
              vec2 movement = vec2(sin(t * 0.5), cos(t * 0.7));
              
              float n1 = fbm(uv * 3.0 + movement + mouseEffect);
              float n2 = fbm(uv * 2.0 - movement - mouseEffect);
              float n3 = fbm(uv * 4.0 + vec2(n1, n2));
              
              vec3 col1 = vec3(0.2, 0.5, 0.8);
              vec3 col2 = vec3(0.8, 0.2, 0.5);
              vec3 col3 = vec3(0.1, 0.8, 0.4);
              
              vec3 finalColor = mix(col1, col2, n1);
              finalColor = mix(finalColor, col3, n2 * 0.5);
              finalColor += n3 * 0.2;
              
              finalColor += vec3(mouseEffect * 0.2);
              
              gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
        transparent={true}
      />
    </mesh>
  )
}

export default function FluidBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas>
        <FluidShader />
      </Canvas>
    </div>
  )
}

