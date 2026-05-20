import { motion } from 'framer-motion'

const orbs = [
  { color: 'from-amber-500/20 to-rose-600/15', size: 'w-[600px] h-[600px]', delay: 0, duration: 20, x: ['-20%', '10%', '-10%', '-20%'], y: ['-20%', '10%', '-30%', '-20%'] },
  { color: 'from-rose-500/15 to-amber-500/15', size: 'w-[500px] h-[500px]', delay: 3, duration: 25, x: ['60%', '40%', '60%', '60%'], y: ['10%', '30%', '20%', '10%'] },
  { color: 'from-emerald-500/12 to-amber-500/15', size: 'w-[400px] h-[400px]', delay: 6, duration: 22, x: ['80%', '60%', '80%', '80%'], y: ['60%', '40%', '50%', '60%'] },
  { color: 'from-amber-500/12 to-rose-500/12', size: 'w-[350px] h-[350px]', delay: 9, duration: 28, x: ['10%', '30%', '20%', '10%'], y: ['70%', '50%', '60%', '70%'] },
  { color: 'from-stone-500/10 to-amber-500/10', size: 'w-[450px] h-[450px]', delay: 12, duration: 24, x: ['30%', '50%', '40%', '30%'], y: ['-10%', '30%', '20%', '-10%'] },
]

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950" />

      {/* Mesh grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(120 113 108) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[100px] bg-gradient-to-br ${orb.color} ${orb.size}`}
          animate={{
            x: orb.x,
            y: orb.y,
          }}
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
