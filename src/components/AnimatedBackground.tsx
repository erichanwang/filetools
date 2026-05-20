import { motion } from 'framer-motion'

const orbs = [
  { color: 'from-stone-600/10 to-stone-500/8', size: 'w-[500px] h-[500px]', delay: 0, duration: 25, x: ['-10%', '20%', '-10%'], y: ['-10%', '10%', '-10%'] },
  { color: 'from-stone-500/8 to-stone-400/6', size: 'w-[400px] h-[400px]', delay: 5, duration: 30, x: ['70%', '50%', '70%'], y: ['30%', '50%', '30%'] },
  { color: 'from-stone-600/6 to-stone-500/6', size: 'w-[350px] h-[350px]', delay: 10, duration: 28, x: ['40%', '60%', '40%'], y: ['60%', '40%', '60%'] },
]

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-stone-950" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(120 113 108) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Minimal floating orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[120px] bg-gradient-to-br ${orb.color} ${orb.size}`}
          animate={{ x: orb.x, y: orb.y }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
