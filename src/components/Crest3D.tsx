import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { MathUtils, SRGBColorSpace } from 'three'
import type { Group } from 'three'
import './Crest3D.css'

type MotionTarget = {
  x: number
  y: number
  scroll: number
  hover: boolean
}

const crestUrl = `${import.meta.env.BASE_URL}crest.png`

function Medal({ target }: { target: RefObject<MotionTarget> }) {
  const group = useRef<Group>(null)
  const texture = useTexture(crestUrl)
  const { invalidate } = useThree()
  const faceTexture = useMemo(() => {
    const copy = texture.clone()
    copy.colorSpace = SRGBColorSpace
    copy.repeat.set(0.886, 0.886)
    copy.offset.set(0.057, 0.057)
    copy.needsUpdate = true
    return copy
  }, [texture])

  useEffect(() => () => faceTexture.dispose(), [faceTexture])

  useFrame((_, delta) => {
    const object = group.current
    const motion = target.current
    if (!object || !motion) return

    const blend = 1 - Math.exp(-Math.min(delta, 0.05) * 7)
    const desiredX = -0.07 + motion.x + motion.scroll * 0.12
    const desiredY = -0.22 + motion.y - motion.scroll * 0.12
    const desiredScale = motion.hover ? 1.045 : 1
    const desiredPosition = -motion.scroll * 0.18

    object.rotation.x = MathUtils.lerp(object.rotation.x, desiredX, blend)
    object.rotation.y = MathUtils.lerp(object.rotation.y, desiredY, blend)
    object.scale.setScalar(MathUtils.lerp(object.scale.x, desiredScale, blend))
    object.position.y = MathUtils.lerp(object.position.y, desiredPosition, blend)

    if (
      Math.abs(object.rotation.x - desiredX) > 0.001 ||
      Math.abs(object.rotation.y - desiredY) > 0.001 ||
      Math.abs(object.scale.x - desiredScale) > 0.001 ||
      Math.abs(object.position.y - desiredPosition) > 0.001
    ) {
      invalidate()
    }
  })

  return (
    <group ref={group} rotation={[-0.07, -0.22, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.075, 1.075, 0.16, 96]} />
        <meshStandardMaterial color="#061c2c" metalness={0.72} roughness={0.33} />
      </mesh>
      <mesh position={[0, 0, 0.083]}>
        <circleGeometry args={[1.035, 96]} />
        <meshBasicMaterial map={faceTexture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.096]}>
        <torusGeometry args={[1.055, 0.018, 12, 96]} />
        <meshStandardMaterial color="#75a9c7" metalness={0.82} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, -0.083]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.92, 72]} />
        <meshStandardMaterial color="#07375e" metalness={0.48} roughness={0.43} />
      </mesh>
    </group>
  )
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Crest3D() {
  const container = useRef<HTMLDivElement>(null)
  const invalidate = useRef<() => void>(() => undefined)
  const target = useRef<MotionTarget>({ x: 0, y: 0, scroll: 0, hover: false })
  const contextListener = useRef<{ canvas: HTMLCanvasElement; onLost: (event: Event) => void } | null>(null)
  const webglFailed = useRef(false)
  const [mode, setMode] = useState<'pending' | 'webgl' | 'still'>('pending')

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    const updateMode = () => {
      setMode(webglFailed.current || reducedMotion.matches || coarsePointer.matches || !canUseWebGL() ? 'still' : 'webgl')
    }

    updateMode()
    reducedMotion.addEventListener('change', updateMode)
    coarsePointer.addEventListener('change', updateMode)
    return () => {
      reducedMotion.removeEventListener('change', updateMode)
      coarsePointer.removeEventListener('change', updateMode)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'webgl') return

    const updateScroll = () => {
      const rect = container.current?.getBoundingClientRect()
      if (!rect) return
      const next = MathUtils.clamp(-rect.top / window.innerHeight, 0, 1)
      if (Math.abs(target.current.scroll - next) > 0.001) {
        target.current.scroll = next
        invalidate.current()
      }
    }

    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [mode])

  useEffect(() => () => {
    const listener = contextListener.current
    if (listener) listener.canvas.removeEventListener('webglcontextlost', listener.onLost)
    contextListener.current = null
  }, [mode])

  const onCanvasCreated = (state: { invalidate: () => void; gl: { domElement: HTMLCanvasElement } }) => {
    invalidate.current = state.invalidate
    const previous = contextListener.current
    if (previous) previous.canvas.removeEventListener('webglcontextlost', previous.onLost)
    const canvas = state.gl.domElement
    const onLost = (event: Event) => {
      event.preventDefault()
      webglFailed.current = true
      setMode('still')
    }
    canvas.addEventListener('webglcontextlost', onLost)
    contextListener.current = { canvas, onLost }
  }

  const movePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (mode !== 'webgl') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1
    target.current.x = MathUtils.clamp(-y * 0.16, -0.16, 0.16)
    target.current.y = MathUtils.clamp(x * 0.31, -0.31, 0.31)
    target.current.hover = true
    invalidate.current()
  }

  const leavePointer = () => {
    target.current.x = 0
    target.current.y = 0
    target.current.hover = false
    invalidate.current()
  }

  return (
    <div
      ref={container}
      className="crest-3d"
      role="img"
      aria-label="Escudo do Grêmio Esportivo Jardim Santo Alberto em um medalhão tridimensional"
      onPointerMove={movePointer}
      onPointerLeave={leavePointer}
    >
      {mode === 'webgl' ? (
        <Canvas
          aria-hidden="true"
          frameloop="demand"
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 3.8], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          onCreated={onCanvasCreated}
        >
          <ambientLight intensity={1.6} />
          <directionalLight position={[-2, 3, 4]} intensity={2.8} color="#e4f4ff" />
          <directionalLight position={[3, -2, 1]} intensity={1.8} color="#4a98cf" />
          <Medal target={target} />
        </Canvas>
      ) : (
        <img className="crest-3d__still" src={crestUrl} alt="" width="500" height="500" />
      )}
    </div>
  )
}
